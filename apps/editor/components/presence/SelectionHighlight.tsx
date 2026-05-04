/**
 * Remote Selection Highlights
 * Show which nodes other users have selected
 */

'use client';

import { usePresence } from '@/hooks/usePresence';
import { useCollaboration } from '@/context/CollaborationContext';
import { useState, useEffect } from 'react';

interface SelectionBadge {
  userId: string;
  userName: string;
  color: string;
  nodeId: string;
}

export function SelectionHighlight() {
  const { collab } = useCollaboration();
  const { users } = usePresence(collab);
  const [selections, setSelections] = useState<SelectionBadge[]>([]);

  useEffect(() => {
    const activeSelections = users
      .filter((u) => u.selection && u.activity === 'editing')
      .map((u) => ({
        userId: u.id,
        userName: u.name,
        color: u.color,
        nodeId: u.selection?.nodeId || '',
      }));

    setSelections(activeSelections);
  }, [users]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {selections.map((selection) => (
        <div
          key={selection.userId}
          className="absolute flex items-center gap-2 pointer-events-none"
          style={{
            // Position would be calculated based on node location in 3D space
            // This is a placeholder for the overlay system
          }}
        >
          {/* Selection outline border */}
          <div
            className="w-full h-full border-2 rounded pointer-events-none"
            style={{
              borderColor: selection.color,
              boxShadow: `0 0 8px ${selection.color}80`,
            }}
          />

          {/* User label */}
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{
              backgroundColor: selection.color,
              opacity: 0.8,
            }}
          >
            {selection.userName}
          </div>
        </div>
      ))}
    </div>
  );
}
