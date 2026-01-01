const WebSocket = require('ws');

// Connect to reply channels first
const wsWipOrders = new WebSocket('ws://localhost:8080/wip-orders');
const wsCancelledOrders = new WebSocket('ws://localhost:8080/cancelled-orders');

wsWipOrders.on('open', () => {
  console.log('Subscribed to /wip-orders channel (for order replies)');
});

wsWipOrders.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('\n📨 Received reply on /wip-orders:');
  console.log(`   Payload:`, JSON.stringify(message, null, 2));
});

wsCancelledOrders.on('open', () => {
  console.log('Subscribed to /cancelled-orders channel (for cancellation replies)');
});

wsCancelledOrders.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('\n📨 Received reply on /cancelled-orders:');
  console.log(`   Payload:`, JSON.stringify(message, null, 2));
});

// Wait for subscriptions to be established
setTimeout(() => {
  testNewOrder();
}, 500);

// Test 1: Place a new order
function testNewOrder() {
  const wsNewOrder = new WebSocket('ws://localhost:8080/new-orders');

  wsNewOrder.on('open', () => {
    console.log('\nConnected to /new-orders channel');
    console.log('-----------------------------------\n');

    console.log('Test 1: Placing a new order...');
    const newOrder = {
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
    };

    wsNewOrder.send(JSON.stringify(newOrder));
    
    // After sending, test delivery
    setTimeout(() => {
      wsNewOrder.close();
      testDelivery();
    }, 2000);
  });

  wsNewOrder.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

// Test 2: Initiate delivery
function testDelivery() {
  const wsDelivery = new WebSocket('ws://localhost:8080/out-for-delivery-orders');
  
  wsDelivery.on('open', () => {
    console.log('\nConnected to /out-for-delivery-orders channel');
    console.log('\nTest 2: Initiating delivery for order...');
    const deliveryRequest = {
      orderId: 10,
      deliveryAddress: '1234 Elm Street, Springfield',
      deliveryDate: '2025-04-14'
    };
    wsDelivery.send(JSON.stringify(deliveryRequest));
  });

  wsDelivery.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('\n📨 Received message from /out-for-delivery-orders:');
    console.log(`   Payload:`, JSON.stringify(message, null, 2));
    
    wsDelivery.close();
    
    // Test cancellation flow
    setTimeout(() => {
      testCancellation();
    }, 2000);
  });

  wsDelivery.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

// Test 3 & 4: Place and cancel order
function testCancellation() {
  const wsNewOrder2 = new WebSocket('ws://localhost:8080/new-orders');
  
  wsNewOrder2.on('open', () => {
    console.log('\nConnected to /new-orders channel (second order)');
    console.log('\nTest 3: Placing another order to cancel...');
    const orderToCancel = {
      id: 20,
      orderItems: [
        {
          id: 3,
          name: 'iPad',
          quantity: 2,
          price: 800
        }
      ]
    };
    wsNewOrder2.send(JSON.stringify(orderToCancel));
    
    wsNewOrder2.close();
    
    // Now cancel it
    setTimeout(() => {
      const wsCancel = new WebSocket('ws://localhost:8080/to-be-cancelled-orders');
      
      wsCancel.on('open', () => {
        console.log('\nConnected to /to-be-cancelled-orders channel');
        console.log('\nTest 4: Cancelling order 20...');
        const cancelRequest = {
          id: 20
        };
        wsCancel.send(JSON.stringify(cancelRequest));
        
        setTimeout(() => {
          wsCancel.close();
          
          console.log('\n-----------------------------------');
          console.log('All tests completed.');
          
          wsWipOrders.close();
          wsCancelledOrders.close();
          process.exit(0);
        }, 1000);
      });

      wsCancel.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }, 1000);
  });

  wsNewOrder2.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

