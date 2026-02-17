const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const WS_PORT = 8080;
const wsServer = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

const orders = new Map();
const channels = {
  '/new-orders': new Set(),
  '/wip-orders': new Set(),
  '/to-be-cancelled-orders': new Set(),
  '/cancelled-orders': new Set(),
  '/out-for-delivery-orders': new Set(),
  '/accepted-orders': new Set()
};

wsServer.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.channel = pathname;
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, request) => {
  const channel = ws.channel;
  console.log(`Client connected to channel: ${channel}`);

  if (channels[channel]) {
    channels[channel].add(ws);
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, channel, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendError(ws, 'Invalid JSON format');
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected from channel: ${channel}`);
    if (channels[channel]) {
      channels[channel].delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(ws, channel, message) {
  console.log(`Received message on channel '${channel}': ${JSON.stringify(message)}`);

  switch (channel) {
    case '/new-orders':
      handleNewOrder(ws, message);
      break;
    case '/to-be-cancelled-orders':
      handleCancelOrder(ws, message);
      break;
    case '/out-for-delivery-orders':
      handleOrderDelivery(ws, message);
      break;
    default:
      sendError(ws, `Unknown channel: ${channel}`);
  }
}

function handleNewOrder(ws, payload) {
  const { id, orderItems } = payload;

  if (!id || !orderItems) {
    sendError(ws, 'Missing required fields: id and orderItems');
    return;
  }

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const order = {
    id,
    totalAmount,
    status: 'INITIATED',
    items: orderItems
  };

  orders.set(id, order);

  const response = {
    id: order.id,
    totalAmount: order.totalAmount,
    status: order.status
  };

  broadcastToChannel('/wip-orders', response);
  console.log(`Order ${id} initiated with total amount: ${totalAmount}`);
}

function handleCancelOrder(ws, payload) {
  console.log(`Received cancel order request: ${JSON.stringify(payload)}`);
  const { id } = payload;

  if (!id) {
    sendError(ws, 'Missing required field: id');
    return;
  }

  let order = orders.get(id);
  if (!order) {
    // This is to handle the case where an order is cancelled before it is accepted.
    // When tests are run , the cancel message may arrive before the new order message.
    order = {id: id, status: 'CANCELLED'};
    orders.set(orderId, order);
  } else {
    order.status = 'CANCELLED';
  }

  const response = {
    reference: id,
    status: 'CANCELLED'
  };

  broadcastToChannel('/cancelled-orders', response);
  console.log(`Order ${id} cancelled`);
}

function handleOrderDelivery(ws, payload) {
  const { orderId, deliveryAddress, deliveryDate } = payload;

  if (!orderId || !deliveryAddress || !deliveryDate) {
    sendError(ws, 'Missing required fields: orderId, deliveryAddress, deliveryDate');
    return;
  }

  let order = orders.get(orderId);
  if (!order) {
    order = {
      id: orderId,
      status: 'SHIPPED',
      deliveryAddress,
      deliveryDate
    };
    orders.set(orderId, order);
  } else {
    order.status = 'SHIPPED';
    order.deliveryAddress = deliveryAddress;
    order.deliveryDate = deliveryDate;
  }

  console.log(`Order ${orderId} is out for delivery to ${deliveryAddress} on ${deliveryDate}`);
  
  ws.send(JSON.stringify({
    orderId,
    status: 'SHIPPED',
    message: 'Order is out for delivery'
  }));
}

function broadcastToChannel(channel, message) {
  if (!channels[channel]) {
    console.error(`Unknown channel: ${channel}`);
    return;
  }

  const messageStr = JSON.stringify(message);
  channels[channel].forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
  console.log(`Broadcasted to ${channel}: ${messageStr}`);
}

function sendError(ws, errorMessage) {
  ws.send(JSON.stringify({
    error: errorMessage
  }));
}

function start() {
  wsServer.listen(WS_PORT, () => {
    console.log(`WebSocket Order API Server running on ws://localhost:${WS_PORT}`);
  });
}

function shutdown() {
  return new Promise((resolve) => {
    wss.close(() => {
      wsServer.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  });
}

module.exports = {
  start,
  shutdown,
  orders,
  broadcastToChannel
};
