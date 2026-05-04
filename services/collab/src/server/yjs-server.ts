/**
 * Yjs WebSocket Server Implementation
 *
 * Handles WebSocket connections for real-time document synchronization
 * using Yjs CRDT protocol.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Pool } from 'pg';
import * as Y from 'yjs';
import { logger } from '../lib/logger.js';
import { generateDocId } from '../lib/id-gen.js';

interface DocManager {
  doc: Y.Doc;
  clients: Set<WebSocket>;
  lastActivity: number;
}

interface PersistenceConfig {
  enabled: boolean;
  retentionDays: number;
  snapshotInterval: number;
}

class YjsServerImpl {
  private docs = new Map<string, DocManager>();
  private wss: WebSocketServer;
  private db: Pool | null;
  private persistence: PersistenceConfig;
  private clientCount = 0;

  constructor(
    wss: WebSocketServer,
    db: Pool | null,
    persistence: PersistenceConfig = {
      enabled: process.env.YJS_PERSISTENCE_ENABLED === 'true',
      retentionDays: parseInt(process.env.YJS_DOC_RETENTION_DAYS || '90', 10),
      snapshotInterval: parseInt(process.env.YJS_SNAPSHOT_INTERVAL || '3600000', 10),
    }
  ) {
    this.wss = wss;
    this.db = db;
    this.persistence = persistence;

    this.setupWebSocketServer();
    this.startMaintenanceTasks();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const url = req.url || '/sync';
      const docId = this.extractDocId(url);

      if (!docId) {
        logger.warn('WebSocket connection rejected: no docId');
        ws.close(4000, 'Missing docId');
        return;
      }

      this.handleClientConnection(ws, docId);
    });

    logger.info('WebSocket server ready for connections');
  }

  private handleClientConnection(ws: WebSocket, docId: string) {
    const clientId = generateDocId(); // Unique client ID
    this.clientCount++;

    logger.info(`Client connected: ${clientId} to doc: ${docId}`);

    // Get or create document
    if (!this.docs.has(docId)) {
      this.docs.set(docId, {
        doc: new Y.Doc(),
        clients: new Set(),
        lastActivity: Date.now(),
      });

      // Load from DB if persistence enabled
      if (this.persistence.enabled && this.db) {
        this.loadDocFromDB(docId);
      }
    }

    const docManager = this.docs.get(docId)!;
    docManager.clients.add(ws);
    docManager.lastActivity = Date.now();

    // Send current state to new client
    const state = Y.encodeStateAsUpdate(docManager.doc);
    ws.send(new Uint8Array(state));

    // Handle incoming updates
    ws.on('message', (message: any) => {
      try {
        const update = new Uint8Array(message);
        Y.applyUpdate(docManager.doc, update);
        docManager.lastActivity = Date.now();

        // Broadcast to other clients
        this.broadcastUpdate(docId, update, ws);

        // Persist periodically
        if (this.persistence.enabled && this.db) {
          this.persistDocToDB(docId);
        }
      } catch (error) {
        logger.error(`Error applying update to ${docId}:`, error);
      }
    });

    ws.on('close', () => {
      docManager.clients.delete(ws);
      this.clientCount--;

      logger.info(`Client disconnected: ${clientId} from doc: ${docId}`);
      logger.debug(`Remaining clients for ${docId}: ${docManager.clients.size}`);

      // Clean up empty docs
      if (docManager.clients.size === 0) {
        logger.debug(`Document ${docId} has no clients`);
        // Keep doc in memory for a while (or implement TTL)
      }
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${docId}:`, error);
    });
  }

  private broadcastUpdate(docId: string, update: Uint8Array, sender?: WebSocket) {
    const docManager = this.docs.get(docId);
    if (!docManager) return;

    docManager.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        try {
          client.send(update);
        } catch (error) {
          logger.error(`Failed to send update to client:`, error);
        }
      }
    });
  }

  private async loadDocFromDB(docId: string) {
    if (!this.db) return;

    try {
      const result = await this.db.query(
        'SELECT state FROM yjs_documents WHERE doc_id = $1',
        [docId]
      );

      if (result.rows.length > 0) {
        const { state } = result.rows[0];
        const docManager = this.docs.get(docId)!;
        Y.applyUpdate(docManager.doc, new Uint8Array(state));
        logger.info(`Loaded document ${docId} from database`);
      }
    } catch (error) {
      logger.error(`Error loading doc ${docId} from DB:`, error);
    }
  }

  private async persistDocToDB(docId: string) {
    if (!this.db) return;

    try {
      const docManager = this.docs.get(docId);
      if (!docManager) return;

      const state = Y.encodeStateAsUpdate(docManager.doc);
      const stateBuffer = Buffer.from(state);

      await this.db.query(
        `INSERT INTO yjs_documents (doc_id, state, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (doc_id)
         DO UPDATE SET state = $2, updated_at = NOW()`,
        [docId, stateBuffer]
      );

      logger.debug(`Persisted document ${docId} to database`);
    } catch (error) {
      logger.error(`Error persisting doc ${docId} to DB:`, error);
    }
  }

  private extractDocId(url: string): string | null {
    // Expected format: /sync?room=<docId>
    const match = url.match(/[?&]room=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private startMaintenanceTasks() {
    // Periodic cleanup of inactive documents
    setInterval(() => {
      const now = Date.now();
      const retentionMs = this.persistence.retentionDays * 24 * 60 * 60 * 1000;

      this.docs.forEach((docManager, docId) => {
        // Remove docs with no clients that haven't been accessed
        if (
          docManager.clients.size === 0 &&
          now - docManager.lastActivity > retentionMs
        ) {
          this.docs.delete(docId);
          logger.debug(`Cleaned up inactive document: ${docId}`);
        }
      });
    }, 60 * 60 * 1000); // Every hour

    // Log stats periodically
    setInterval(() => {
      logger.info(
        `Server stats: ${this.clientCount} clients, ${this.docs.size} active documents`
      );
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  getStats() {
    return {
      clientCount: this.clientCount,
      docCount: this.docs.size,
      docs: Array.from(this.docs.entries()).map(([docId, manager]) => ({
        docId,
        clients: manager.clients.size,
        lastActivity: manager.lastActivity,
      })),
    };
  }
}

export function createYjsServer(wss: WebSocketServer, db: Pool | null) {
  return new YjsServerImpl(wss, db);
}
