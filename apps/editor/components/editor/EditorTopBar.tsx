/**
 * Editor Top Bar - Project name, presence, actions
 */

'use client';

import { PresenceAvatars } from '../presence/PresenceAvatars';

interface EditorTopBarProps {
  projectName: string;
  projectId: string;
  accessLevel: string;
  isConnected: boolean;
  connectedUsers: any[];
}

export function EditorTopBar({
  projectName,
  projectId,
  accessLevel,
  isConnected,
  connectedUsers,
}: EditorTopBarProps) {
  return (
    <div className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Left: Project Name + Sync Status */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{projectName}</h1>

        {/* Sync status indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-white/60">
            {isConnected ? 'Synced' : 'Syncing...'}
          </span>
        </div>
      </div>

      {/* Center: Presence Avatars */}
      <PresenceAvatars />

      {/* Right: Actions */}
      <div className="flex gap-2">
        {accessLevel !== 'viewer' && (
          <>
            <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
              Share
            </button>
            <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
              Export
            </button>
          </>
        )}

        {accessLevel === 'viewer' && (
          <span className="px-4 py-2 text-sm text-white/60 bg-white/5 rounded">
            Viewer Mode
          </span>
        )}
      </div>
    </div>
  );
}
