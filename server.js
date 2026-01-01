const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const orders = new Map();

console.log(`WebSocket Order API Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      sendError(ws, 'Invalid JSON format');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleMessage(ws, message) {
  const { channel, headers, payload } = message;

  console.log(`Received message on channel: ${channel}`);

  switch (channel) {
    case 'new-orders':
      handleNewOrder(ws, headers, payload);
      break;
    case 'to-be-cancelled-orders':
      handleCancelOrder(ws, headers, payload);
      break;
    case 'out-for-delivery-orders':
      handleOrderDelivery(ws, payload);
      break;
    default:
      sendError(ws, `Unknown channel: ${channel}`);
  }
}

function handleNewOrder(ws, headers, payload) {
  const { id, orderItems } = payload;
  const { orderCorrelationId } = headers || {};

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
    channel: 'wip-orders',
    headers: {
      orderCorrelationId: orderCorrelationId || `auto-${Date.now()}`
    },
    payload: {
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status
    }
  };

  ws.send(JSON.stringify(response));
  console.log(`Order ${id} initiated with total amount: ${totalAmount}`);

  setTimeout(() => {
    sendOrderAccepted(ws, id);
  }, 2000);
}

function handleCancelOrder(ws, headers, payload) {
  const { id } = payload;
  const { orderCorrelationId } = headers || {};

  if (!id) {
    sendError(ws, 'Missing required field: id');
    return;
  }

  const order = orders.get(id);
  if (!order) {
    sendError(ws, `Order ${id} not found`);
    return;
  }

  order.status = 'CANCELLED';

  const response = {
    channel: 'cancelled-orders',
    headers: {
      orderCorrelationId: orderCorrelationId || `auto-${Date.now()}`
    },
    payload: {
      reference: id,
      status: 'CANCELLED'
    }
  };

  ws.send(JSON.stringify(response));
  console.log(`Order ${id} cancelled`);
}

function handleOrderDelivery(ws, payload) {
  const { orderId, deliveryAddress, deliveryDate } = payload;

  if (!orderId || !deliveryAddress || !deliveryDate) {
    sendError(ws, 'Missing required fields: orderId, deliveryAddress, deliveryDate');
    return;
  }

  const order = orders.get(orderId);
  if (!order) {
    sendError(ws, `Order ${orderId} not found`);
    return;
  }

  order.status = 'SHIPPED';
  order.deliveryAddress = deliveryAddress;
  order.deliveryDate = deliveryDate;

  console.log(`Order ${orderId} is out for delivery to ${deliveryAddress} on ${deliveryDate}`);
  
  ws.send(JSON.stringify({
    channel: 'delivery-confirmation',
    payload: {
      orderId,
      status: 'SHIPPED',
      message: 'Order is out for delivery'
    }
  }));
}

function sendOrderAccepted(ws, orderId) {
  const order = orders.get(orderId);
  if (!order || order.status === 'CANCELLED') {
    return;
  }

  order.status = 'ACCEPTED';

  const message = {
    channel: 'accepted-orders',
    payload: {
      id: orderId,
      status: 'ACCEPTED',
      timestamp: new Date().toISOString()
    }
  };

  ws.send(JSON.stringify(message));
  console.log(`Order ${orderId} accepted`);
}

function sendError(ws, errorMessage) {
  ws.send(JSON.stringify({
    channel: 'error',
    payload: {
      error: errorMessage
    }
  }));
}

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
