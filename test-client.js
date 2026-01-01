const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  console.log('-----------------------------------\n');

  console.log('Test 1: Placing a new order...');
  const newOrder = {
    channel: 'new-orders',
    headers: {
      orderCorrelationId: '12345'
    },
    payload: {
      id: 10,
      orderItems: [
        {
          id: 1,
          name: 'Macbook',
          quantity: 1,
          price: 2000
        },
        {
          id: 2,
          name: 'Iphone',
          quantity: 1,
          price: 1000
        }
      ]
    }
  };

  ws.send(JSON.stringify(newOrder));

  setTimeout(() => {
    console.log('\nTest 2: Initiating delivery for order...');
    const deliveryRequest = {
      channel: 'out-for-delivery-orders',
      payload: {
        orderId: 10,
        deliveryAddress: '1234 Elm Street, Springfield',
        deliveryDate: '2025-04-14'
      }
    };
    ws.send(JSON.stringify(deliveryRequest));
  }, 3000);

  setTimeout(() => {
    console.log('\nTest 3: Placing another order to cancel...');
    const orderToCancel = {
      channel: 'new-orders',
      headers: {
        orderCorrelationId: '67890'
      },
      payload: {
        id: 20,
        orderItems: [
          {
            id: 3,
            name: 'iPad',
            quantity: 2,
            price: 800
          }
        ]
      }
    };
    ws.send(JSON.stringify(orderToCancel));
  }, 5000);

  setTimeout(() => {
    console.log('\nTest 4: Cancelling order 20...');
    const cancelRequest = {
      channel: 'to-be-cancelled-orders',
      headers: {
        orderCorrelationId: '67890'
      },
      payload: {
        id: 20
      }
    };
    ws.send(JSON.stringify(cancelRequest));
  }, 7000);

  setTimeout(() => {
    console.log('\n-----------------------------------');
    console.log('All tests completed. Closing connection...');
    ws.close();
  }, 9000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('\n📨 Received message:');
  console.log(`   Channel: ${message.channel}`);
  if (message.headers) {
    console.log(`   Correlation ID: ${message.headers.orderCorrelationId}`);
  }
  console.log(`   Payload:`, JSON.stringify(message.payload, null, 2));
});

ws.on('close', () => {
  console.log('\nDisconnected from server');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
