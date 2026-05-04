/**
 * Presence Avatars - Show connected users in top bar
 */

'use client';

import { usePresence } from '@/hooks/usePresence';
import { useCollaboration } from '@/context/CollaborationContext';
import { useState, useEffect } from 'react';

interface Avatar {
  id: string;
  name: string;
  color: string;
  initials: string;
}

export function PresenceAvatars() {
  const { collab } = useCollaboration();
  const { users, isConnected } = usePresence(collab);
  const [avatars, setAvatars] = useState<Avatar[]>([]);

  useEffect(() => {
    const filtered = users
      .filter((u) => u.activity !== 'idle')
      .slice(0, 4) // Show max 4 avatars
      .map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        initials: u.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
      }));

    setAvatars(filtered);
  }, [users]);

  return (
    <div className="flex items-center gap-2">
      {/* Connection status */}
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={isConnected ? 'Connected' : 'Disconnected'}
      />

      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {avatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: avatar.color }}
            title={avatar.name}
            style={{
              backgroundColor: avatar.color,
              zIndex: avatars.length - index,
            }}
          >
            {avatar.initials}
          </div>
        ))}
      </div>

      {/* User count */}
      {users.length > 0 && (
        <span className="text-xs text-white/60 ml-2">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
