import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './services/roomManager.js';
import { SocketHandler } from './socket/handlers/socketHandler.js';

const app = express();
const port = process.env.PORT || 3000;

// Read CLIENT_URL environment variable to allow dynamic frontend origins.
// Supports comma-separated list of origins (or '*' as fallback).
const clientUrl = process.env.CLIENT_URL || '';
const allowedOrigins = clientUrl
  ? clientUrl.split(',').map((origin) => origin.trim())
  : [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Always allow localhost/127.0.0.1 on any port for local testing
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    
    if (isLocalhost || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize core room manager and socket handler
const roomManager = new RoomManager();

// Create HTTP server
const server = http.createServer(app);

// Bind Socket.io with production/development configuration
const io = new Server(server, {
  cors: corsOptions,
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

// API root welcome message
app.get('/', (req, res) => {
  res.json({ message: "HandCricket Arena API Server is active." });
});

// Start listening
server.listen(port, () => {
  console.log(`[HandCricket Arena] Server running on port ${port}`);
});
