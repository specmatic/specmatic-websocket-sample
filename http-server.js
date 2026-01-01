const express = require('express');
const { orders, broadcastToChannel } = require('./ws-server');

const HTTP_PORT = 9000;
const app = express();

app.use(express.json());

app.put('/orders', (req, res) => {
  const { id, status, timestamp } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing required field: id' });
  }

  const order = orders.get(id) || { id: id };

  order.status = status;
  order.timestamp = timestamp || new Date().toISOString();

  const message = {
    id: order.id,
    status: order.status,
    timestamp: order.timestamp
  };

  broadcastToChannel('/accepted-orders', message);
  console.log(`Order ${id} accepted via HTTP`);

  res.json(message);
});

app.get('/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.query;

  if (!orderId || isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: `Order ${orderId} not found` });
  }

  if (status && order.status !== status) {
    return res.status(404).json({ error: `Order ${orderId} not found with status ${status}` });
  }

  res.json(order);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

function start() {
  app.listen(HTTP_PORT, () => {
    console.log(`HTTP API Server running on http://localhost:${HTTP_PORT}`);
  });
  return app;
}

module.exports = {
  start,
  app
};
