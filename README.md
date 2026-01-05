# WebSocket Order API

A WebSocket-based Order Management API following the AsyncAPI 3.0.0 specification.

## Overview

This project implements a real-time order management system using WebSockets. It supports order placement, cancellation, acceptance, and delivery tracking through various channels.

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

## Run Contract Tests

```bash
npm run contractTest
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


