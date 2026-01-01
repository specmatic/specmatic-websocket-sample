# WebSocket Order API

A WebSocket-based Order Management API following the AsyncAPI 3.0.0 specification.

## Overview

This project implements a real-time order management system using WebSockets. It supports order placement, cancellation, acceptance, and delivery tracking through various channels.

## Features

- **Place Orders**: Submit new orders with multiple items
- **Cancel Orders**: Request order cancellations
- **Order Tracking**: Receive real-time updates on order status
- **Delivery Management**: Initiate and track order deliveries
- **Correlation IDs**: Track request-response cycles

## Architecture

The system uses channels to organize different message types:

- `new-orders`: Receive new order requests
- `wip-orders`: Send order initiation confirmations
- `to-be-cancelled-orders`: Receive cancellation requests
- `cancelled-orders`: Send cancellation confirmations
- `accepted-orders`: Send order acceptance notifications
- `out-for-delivery-orders`: Receive delivery initiation requests

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

```bash
npm install
```

## Usage

### Start the Server

```bash
npm start
```

The server will start on `ws://localhost:8080`

### Run the Test Client

In a separate terminal:

```bash
npm test
```

This will run automated tests demonstrating all API features.

## Message Format

All messages follow this structure:

```json
{
  "channel": "channel-name",
  "headers": {
    "orderCorrelationId": "unique-id"
  },
  "payload": {
    // Channel-specific data
  }
}
```

## API Examples

### Place a New Order

**Send to channel**: `new-orders`

```json
{
  "channel": "new-orders",
  "headers": {
    "orderCorrelationId": "12345"
  },
  "payload": {
    "id": 10,
    "orderItems": [
      {
        "id": 1,
        "name": "Macbook",
        "quantity": 1,
        "price": 2000
      },
      {
        "id": 2,
        "name": "Iphone",
        "quantity": 1,
        "price": 1000
      }
    ]
  }
}
```

**Response on channel**: `wip-orders`

```json
{
  "channel": "wip-orders",
  "headers": {
    "orderCorrelationId": "12345"
  },
  "payload": {
    "id": 10,
    "totalAmount": 3000,
    "status": "INITIATED"
  }
}
```

**Automatic notification on channel**: `accepted-orders` (after 2 seconds)

```json
{
  "channel": "accepted-orders",
  "payload": {
    "id": 10,
    "status": "ACCEPTED",
    "timestamp": "2026-01-01T06:00:00.000Z"
  }
}
```

### Cancel an Order

**Send to channel**: `to-be-cancelled-orders`

```json
{
  "channel": "to-be-cancelled-orders",
  "headers": {
    "orderCorrelationId": "12345"
  },
  "payload": {
    "id": 10
  }
}
```

**Response on channel**: `cancelled-orders`

```json
{
  "channel": "cancelled-orders",
  "headers": {
    "orderCorrelationId": "12345"
  },
  "payload": {
    "reference": 10,
    "status": "CANCELLED"
  }
}
```

### Initiate Order Delivery

**Send to channel**: `out-for-delivery-orders`

```json
{
  "channel": "out-for-delivery-orders",
  "payload": {
    "orderId": 10,
    "deliveryAddress": "1234 Elm Street, Springfield",
    "deliveryDate": "2025-04-14"
  }
}
```

## Order Status Flow

Orders progress through the following statuses:

1. `PENDING` - Initial state
2. `INITIATED` - Order received and processing started
3. `ACCEPTED` - Order accepted by warehouse
4. `SHIPPED` - Order out for delivery
5. `DELIVERED` - Order delivered to customer
6. `CANCELLED` - Order cancelled

## Project Structure

```
.
├── server.js           # WebSocket server implementation
├── test-client.js      # Test client with examples
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Implementation Details

- **Technology**: Node.js with `ws` library
- **Port**: 8080
- **Protocol**: WebSocket (ws://)
- **Data Format**: JSON
- **Correlation**: Request-response correlation via orderCorrelationId

## Error Handling

Errors are sent on the `error` channel:

```json
{
  "channel": "error",
  "payload": {
    "error": "Error description"
  }
}
```

## Development

The code is designed to be simple and easy to understand:

- Clear function names describing their purpose
- Comprehensive logging for debugging
- Separation of concerns (message handling, business logic)
- In-memory storage for demo purposes (use a database in production)

## License

ISC
