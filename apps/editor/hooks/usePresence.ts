/**
 * usePresence Hook
 * Track connected users and their presence (cursors, selections, activity)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CollaborationManager } from '@/lib/collab';

interface User {
  clientId: number;
  name: string;
  color: string;
  id: string;
  cursor?: { x: number; y: number; z: number };
  selection?: { nodeId: string };
  activity: 'idle' | 'editing' | 'viewing';
  lastUpdate: number;
}

export function usePresence(collab: CollaborationManager | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!collab) return;

    // Track connection status
    const checkConnection = () => {
      setIsConnected(collab.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    // Subscribe to presence updates
    collab.onPresenceChanged((presenceMap) => {
      const userList = Array.from(presenceMap.entries()).map(
        ([clientId, presence]) => ({
          clientId,
          name: presence.user?.name || 'Anonymous',
          color: presence.user?.color || '#999999',
          id: presence.user?.id || `user_${clientId}`,
          cursor: presence.cursor,
          selection: presence.selection,
          activity: presence.activity || 'idle',
          lastUpdate: presence.lastUpdate || Date.now(),
        })
      );
      setUsers(userList);
    });

    return () => {
      clearInterval(interval);
    };
  }, [collab]);

  // Memoized functions for updating presence
  const updateCursor = useCallback(
    (x: number, y: number, z: number) => {
      collab?.updateCursor(x, y, z);
    },
    [collab]
  );

  const updateSelection = useCallback(
    (nodeId: string) => {
      collab?.updateSelection(nodeId);
    },
    [collab]
  );

  const setActivity = useCallback(
    (activity: 'idle' | 'editing' | 'viewing') => {
      collab?.setActivity(activity);
    },
    [collab]
  );

  return {
    users,
    isConnected,
    updateCursor,
    updateSelection,
    setActivity,
  };
}
