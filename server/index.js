import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from '@y/websocket-server/utils';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/api.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', apiRoutes);

// Root path endpoint for debugging
app.get('/', (req, res) => {
  res.json({ message: '✅ CodeSync Backend is running!', endpoint: '/api/execute' });
});

// WebSocket Server for Yjs
const wss = new WebSocketServer({ server });

// Yjs WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  const roomId = req.url.slice(1); // Remove leading '/'
  console.log(`✅ User joined room: ${roomId}`);
  
  // Use Yjs setupWSConnection for CRDT handling
  setupWSConnection(ws, req, { docName: roomId });
});

// 404 Handler
app.use((req, res) => {
  console.error(`❌ 404 - ${req.method} ${req.path} not found`);
  res.status(404).json({ 
    error: `Endpoint not found: ${req.path}`,
    availableEndpoints: ['GET /', 'GET /api/health', 'POST /api/execute']
  });
});

// Start server
const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`\n✨ CodeSync IDE Server Started ✨`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/[roomId]`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`💬 Chat & Multi-file Sync enabled`);
  console.log(`📝 Code execution via Piston API\n`);
});
