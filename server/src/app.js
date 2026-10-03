import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
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

  // In production the API also serves the built React app (single deployable service).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found.')));
  app.use(errorHandler);
  return app;
}