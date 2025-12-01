// server.js - Permanent History Version
const { WebSocketServer } = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocketServer({ server });

// Map: RoomName -> { clients: Set, history: Array }
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const roomName = req.url;
  
  // 1. Initialize Room if missing
  if (!rooms.has(roomName)) {
    rooms.set(roomName, { 
      clients: new Set(), 
      history: [] 
    });
    console.log(`🆕 Room created: ${roomName}`);
  }

  const room = rooms.get(roomName);
  room.clients.add(ws);
  console.log(`User joined ${roomName}. Total users: ${room.clients.size}`);

  // 2. REPLAY HISTORY (The key to persistence)
  if (room.history.length > 0) {
    console.log(`Sending ${room.history.length} old updates to new user...`);
    room.history.forEach((update) => {
      ws.send(update);
    });
  }

  // 3. Handle Messages
  ws.on('message', (message, isBinary) => {
    // Save to history
    room.history.push(message);

    // Broadcast to others
    room.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message, { binary: isBinary });
      }
    });
  });

  // 4. Cleanup
  ws.on('close', () => {
    room.clients.delete(ws);
    console.log(`User left ${roomName}. Remaining users: ${room.clients.size}`);
    
    // ❌ REMOVED THE DELETION LOGIC
    // We keep the room in memory even if it's empty!
    // if (room.clients.size === 0) {
    //    rooms.delete(roomName); 
    // }
  });
});

server.listen(1234, () => {
  console.log('✅ Server running on port 1234 (Persistent Memory Mode)');
});
