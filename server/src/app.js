import express from 'express';
import cors from 'cors';
import { createTicketsRepo } from './ticketsRepo.js';
import { ticketsRouter } from './routes.js';
import { errorHandler, ApiError } from './errors.js';

export function createApp(db) {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/tickets', ticketsRouter(createTicketsRepo(db)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found.')));
  app.use(errorHandler);
  return app;
}
