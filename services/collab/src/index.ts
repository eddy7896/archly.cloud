/**
 * Yjs WebSocket Collaboration Server
 *
 * Handles real-time document synchronization and presence tracking
 * for archly.cloud collaborative editing.
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { logger } from './lib/logger.js';
import { createYjsServer } from './server/yjs-server.js';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const app = express();
const httpServer = createServer(app);

// Environment
const PORT = parseInt(process.env.YJS_PORT || '1234', 10);
const HOST = process.env.YJS_HOST || '0.0.0.0';
const DB_URL = process.env.YJS_PERSISTENCE_DB_URL;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Initialize logger
logger.setLevel(LOG_LEVEL as any);

// Database pool for persistence
const db = DB_URL
  ? new Pool({ connectionString: DB_URL })
  : null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
  res.json(stats);
});

// WebSocket server for Yjs
const wss = new WebSocketServer({ server: httpServer, path: '/sync' });

// Create Yjs server
const yjsServer = createYjsServer(wss, db);

// Error handling
wss.on('error', (error) => {
  logger.error('WebSocket server error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down Yjs server...');

  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  if (db) {
    await db.end();
    logger.info('Database pool closed');
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
httpServer.listen(PORT, HOST, () => {
  logger.info(`Yjs WebSocket server running on ws://${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/health`);
  logger.info(`Stats: http://${HOST}:${PORT}/stats`);

  if (DB_URL) {
    logger.info('Persistence enabled with PostgreSQL');
  } else {
    logger.warn('Persistence disabled (in-memory only)');
  }
});

export { app, httpServer, wss };
