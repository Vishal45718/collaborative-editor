// server.js - CodeSync Backend with Yjs WebSocket Server
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from '@y/websocket-server/utils';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// MongoDB Connection (Optional - comment out if not using)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codesync')
// .then(() => console.log('✅ Connected to MongoDB'))
// .catch(err => console.error('❌ MongoDB connection error:', err));

// Room Schema for persistence (Optional)
// const roomSchema = new mongoose.Schema({
//   roomId: { type: String, required: true, unique: true },
//   name: { type: String, default: '' },
//   language: { type: String, default: 'cpp' },
//   createdAt: { type: Date, default: Date.now },
//   lastActivity: { type: Date, default: Date.now },
//   participants: [{ type: String }], // Array of usernames
//   code: { type: String, default: '' }, // Last saved code
// });

// const Room = mongoose.model('Room', roomSchema);

// WebSocket Server for Yjs
const wss = new WebSocketServer({ server });

// Yjs WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  const roomId = req.url.slice(1); // Remove leading '/'
  console.log(`🔗 Yjs connection established for room: ${roomId}`);

  // Use Yjs setupWSConnection for proper CRDT handling
  setupWSConnection(ws, req, { docName: roomId });

  // Track room activity (Optional - requires MongoDB)
  // Room.findOneAndUpdate(
  //   { roomId },
  //   {
  //     $setOnInsert: { roomId, createdAt: new Date() },
  //     lastActivity: new Date()
  //   },
  //   { upsert: true, new: true }
  // ).catch(err => console.error('Error updating room:', err));
});

// API Routes (Optional - require MongoDB)
// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// Get room info
// app.get('/api/rooms/:roomId', async (req, res) => {
//   try {
//     const room = await Room.findOne({ roomId: req.params.roomId });
//     if (!room) {
//       return res.status(404).json({ error: 'Room not found' });
//     }
//     res.json({
//       roomId: room.roomId,
//       name: room.name,
//       language: room.language,
//       participants: room.participants,
//       lastActivity: room.lastActivity
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Update room info
// app.put('/api/rooms/:roomId', async (req, res) => {
//   try {
//     const { name, language, code } = req.body;
//     const room = await Room.findOneAndUpdate(
//       { roomId: req.params.roomId },
//       {
//         name,
//         language,
//         code,
//         lastActivity: new Date()
//       },
//       { upsert: true, new: true }
//     );
//     res.json(room);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Add participant to room
// app.post('/api/rooms/:roomId/participants', async (req, res) => {
//   try {
//     const { username } = req.body;
//     const room = await Room.findOneAndUpdate(
//       { roomId: req.params.roomId },
//       {
//         $addToSet: { participants: username },
//         lastActivity: new Date()
//       },
//       { upsert: true, new: true }
//     );
//     res.json({ participants: room.participants });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Remove participant from room
// app.delete('/api/rooms/:roomId/participants/:username', async (req, res) => {
//   try {
//     const room = await Room.findOneAndUpdate(
//       { roomId: req.params.roomId },
//       {
//         $pull: { participants: req.params.username },
//         lastActivity: new Date()
//       },
//       { new: true }
//     );
//     res.json({ participants: room.participants });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Get active rooms (for admin/stats)
// app.get('/api/rooms', async (req, res) => {
//   try {
//     const rooms = await Room.find({ lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
//       .sort({ lastActivity: -1 })
//       .limit(50);
//     res.json(rooms);
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Start server
const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`🚀 CodeSync server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/[roomId]`);
  console.log(`🌐 HTTP API: http://localhost:${PORT}/api`);
});
