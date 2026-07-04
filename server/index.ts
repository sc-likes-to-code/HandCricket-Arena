import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager';
import { SocketHandler } from './socketHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for API requests in dev
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Initialize core room manager and socket handler
const roomManager = new RoomManager();

// Create HTTP server
const server = http.createServer(app);

// Bind Socket.io with production/development configuration
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const socketHandler = new SocketHandler(io, roomManager);

// Bind socket connection handler
io.on('connection', (socket) => {
  socketHandler.handleConnection(socket);
});

// Periodic stale rooms cleanup (every 60 seconds)
setInterval(() => {
  try {
    roomManager.runCleanup();
  } catch (err) {
    console.error('Error running Room Manager cleanup:', err);
  }
}, 60000);

// API route to get active room counts or status check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Serve frontend static assets in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all routes to index.html for React Router compatibility
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start listening
server.listen(port, () => {
  console.log(`[HandCricket Arena] Server running on port ${port}`);
});
