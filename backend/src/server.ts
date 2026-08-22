import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/db';

import authRoutes from './routes/auth';
import tripsRoutes from './routes/trips';
import stopsRoutes from './routes/stops';
import activitiesRoutes from './routes/activities';
import budgetRoutes from './routes/budget';
import aiRoutes from './routes/ai';
import sharingRoutes from './routes/sharing';
import collaborationRoutes from './routes/collaboration';
import destinationsRoutes from './routes/destinations';
import weatherRoutes from './routes/weather';
import templatesRoutes from './routes/templates';
import notificationsRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Schema on start
initDatabase();

app.use(cors());
app.use(express.json());

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api', stopsRoutes);
app.use('/api', activitiesRoutes);
app.use('/api', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', sharingRoutes);
app.use('/api', collaborationRoutes);
app.use('/api', destinationsRoutes);
app.use('/api', weatherRoutes);
app.use('/api', templatesRoutes);
app.use('/api', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', service: 'GlobeTrotter REST API', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  return res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 GlobeTrotter Backend Server running at http://localhost:${PORT}`);
});
