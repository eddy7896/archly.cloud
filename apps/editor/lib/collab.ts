/**
 * Real-Time Collaboration Setup
 * Yjs CRDT + WebSocket + Presence tracking
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

interface UserPresence {
  user: {
    name: string;
    color: string;
    id: string;
  };
  cursor?: {
    x: number;
    y: number;
    z: number;
  };
  selection?: {
    nodeId: string;
  };
  activity?: 'idle' | 'editing' | 'viewing';
  lastUpdate: number;
}

export class CollaborationManager {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private awareness: Awareness | null = null;
  private ymap: Y.Map<any>;
  private onUpdate: ((state: any) => void) | null = null;
  private onPresenceUpdate: ((users: Map<number, UserPresence>) => void) | null = null;

  constructor() {
    this.ydoc = new Y.Doc();
    this.ymap = this.ydoc.getMap('scene');
  }

  /**
   * Connect to collab server
   */
  connect(
    projectId: string,
    userId: string,
    userName: string,
    userColor: string
  ) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';

    this.provider = new WebsocketProvider(
      wsUrl,
      `project_${projectId}`,
      this.ydoc,
      {
        connect: true,
        awareness: new Awareness(this.ydoc),
      }
    );

    this.awareness = this.provider.awareness;

    // Set local user presence
    this.awareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
        id: userId,
      },
      activity: 'viewing',
      lastUpdate: Date.now(),
    } as UserPresence);

    // Listen for remote updates
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'local' && this.onUpdate) {
        this.onUpdate(this.ymap.toJSON());
      }
    });

    // Listen for presence changes
    this.awareness.on('change', (changes: any) => {
      if (this.onPresenceUpdate) {
        const users = new Map<number, UserPresence>();
        this.awareness!.getStates().forEach((state: any, clientId: number) => {
          users.set(clientId, state);
        });
        this.onPresenceUpdate(users);
      }
    });

    console.log(`Connected to project: ${projectId}`);
  }

  /**
   * Disconnect from collab server
   */
  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider = null;
    }
    if (this.awareness) {
      this.awareness.destroy();
      this.awareness = null;
    }
  }

  /**
   * Update scene state
   */
  updateScene(data: Record<string, any>) {
    this.ymap.set('state', data);
  }

  /**
   * Get current scene state
   */
  getScene(): Record<string, any> {
    return this.ymap.get('state') || {};
  }

  /**
   * Update user cursor position
   */
  updateCursor(x: number, y: number, z: number) {
    if (!this.awareness) return;

    const state = this.awareness.getLocalState() as UserPresence;
    this.awareness.setLocalState({
      ...state,
      cursor: { x, y, z },
      lastUpdate: Date.now(),
    });
  }

  /**
   * Update user selection
   */
  updateSelection(nodeId: string) {
    if (!this.awareness) return;

    const state = this.awareness.getLocalState() as UserPresence;
    this.awareness.setLocalState({
      ...state,
      selection: { nodeId },
      activity: 'editing',
      lastUpdate: Date.now(),
    });
  }

  /**
   * Update user activity status
   */
  setActivity(activity: 'idle' | 'editing' | 'viewing') {
    if (!this.awareness) return;

    const state = this.awareness.getLocalState() as UserPresence;
    this.awareness.setLocalState({
      ...state,
      activity,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Get connected users
   */
  getConnectedUsers(): Map<number, UserPresence> {
    if (!this.awareness) return new Map();

    const users = new Map<number, UserPresence>();
    this.awareness.getStates().forEach((state: any, clientId: number) => {
      users.set(clientId, state);
    });
    return users;
  }

  /**
   * Subscribe to scene updates
   */
  onSceneUpdate(callback: (state: any) => void) {
    this.onUpdate = callback;
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceChanged(callback: (users: Map<number, UserPresence>) => void) {
    this.onPresenceUpdate = callback;
  }

  /**
   * Get Yjs document
   */
  getDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.provider?.connected ?? false;
  }
}

// Singleton instance
let collabManager: CollaborationManager | null = null;

export function getCollaborationManager(): CollaborationManager {
  if (!collabManager) {
    collabManager = new CollaborationManager();
  }
  return collabManager;
}

export function createCollaborationManager(): CollaborationManager {
  return new CollaborationManager();
}
