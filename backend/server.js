import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { startCronJobs } from './utils/cronJobs.js';

dotenv.config();
connectDB();
startCronJobs();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: 'Food Surplus API' }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

io.on('connection', (socket) => {
  socket.on('join-location', ({ latitude, longitude }) => {
    const room = `loc_${Math.floor(latitude)}_${Math.floor(longitude)}`;
    socket.join(room);
  });

  socket.on('leave-location', (room) => socket.leave(room));

  socket.on('join-listing', (listingId) => {
    socket.join(`listing_${listingId}`);
  });

  socket.on('send-message', ({ listingId, message }) => {
    io.to(`listing_${listingId}`).emit('receive-message', message);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io };
