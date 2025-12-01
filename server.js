// server.js - The "Manual" Approach
const { WebSocketServer } = require('ws');
// We are NOT importing y-websocket utils to avoid the export errors.
// We will build a basic relay server.

const wss = new WebSocketServer({ port: 1234 });
console.log("WebSocket Server running on port 1234");

// Map to store document updates
// In a real app, you'd use Yjs logic here, but for "Hello World", 
// a simple broadcast works to prove connection.
const rooms = new Map();

wss.on('connection', (ws, req) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    // Broadcast message to all other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message);
      }
    });
  });
});
