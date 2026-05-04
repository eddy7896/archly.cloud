/**
 * Remote Cursor Badges
 * Show where other users are looking/pointing
 */

'use client';

import { usePresence } from '@/hooks/usePresence';
import { useCollaboration } from '@/context/CollaborationContext';
import { useState, useEffect } from 'react';

interface CursorBadge {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export function PresenceCursor() {
  const { collab } = useCollaboration();
  const { users } = usePresence(collab);
  const [cursors, setCursors] = useState<CursorBadge[]>([]);

  useEffect(() => {
    const activeCursors = users
      .filter((u) => u.cursor && u.activity !== 'idle')
      .map((u) => ({
        userId: u.id,
        userName: u.name,
        color: u.color,
        x: u.cursor?.x || 0,
        y: u.cursor?.y || 0,
      }));

    setCursors(activeCursors);
  }, [users]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="fixed flex items-center gap-1 pointer-events-none"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={cursor.color}
            style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))` }}
          >
            <path d="M0 0L0 14L4 9L8 15L10 13L6 7L12 7Z" />
          </svg>

          {/* Name label */}
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
            style={{
              backgroundColor: cursor.color,
              opacity: 0.9,
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
