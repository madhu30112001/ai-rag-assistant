import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

const app = express();
const port = process.env.PORT;

// Apply a broad API limit plus a stricter limit to expensive chat requests.
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// Configure security headers, cross-origin access, parsing, and API protection.
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRateLimit);

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: process.env.GOOGLE_API_KEY ? 'configured' : 'not configured',
  });
});
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRateLimit, chatRoutes);

// Convert known operational failures into safe JSON responses for the client.
app.use((error, _request, response, _next) => {
  console.error('Error:', error);
  const status =
    error.status ||
    (error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : error.code?.startsWith('LIMIT_') || error.type === 'entity.parse.failed'
        ? 400
        : 500);
  if (status === 500) {
    response.status(status).json({
      message: 'Internal server error.',
    });
  } else {
    response.status(status).json({
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

app.listen(port, () => console.log(`RAG API listening on port ${port}`));
connectDB().catch((error) => {
  console.error(`Database connection unavailable: ${error.message}`);
});
