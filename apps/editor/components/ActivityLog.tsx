/**
 * Activity Log - Audit trail display
 */

'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  action: string;
  user?: { name: string; avatarUrl?: string };
  metadata?: Record<string, any>;
  timestamp: string;
}

interface ActivityLogProps {
  projectId: string;
  limit?: number;
}

export function ActivityLog({ projectId, limit = 50 }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/activity?limit=${limit}`
        );
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [projectId, limit]);

  const formatAction = (action: string) => {
    const actions: Record<string, string> = {
      created_project: '📁 Created project',
      updated_node: '✏️ Updated node',
      deleted_node: '🗑️ Deleted node',
      published: '📢 Published',
      commented: '💬 Added comment',
      cloned_project: '📋 Cloned project',
      shared: '🔗 Shared project',
      edited: '✏️ Edited',
    };
    return actions[action] || action;
  };

  if (loading) {
    return <div className="text-white/40 text-sm">Loading activity...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-white/40 text-sm">No activity yet</div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors"
        >
          {/* Avatar */}
          {activity.user?.avatarUrl ? (
            <img
              src={activity.user.avatarUrl}
              alt={activity.user.name}
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs">
              {activity.user?.name[0] || '?'}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              <span className="font-medium">{activity.user?.name || 'Unknown'}</span>
              {' '}
              <span className="text-white/70">
                {formatAction(activity.action)}
              </span>
            </p>
            <p className="text-xs text-white/40">
              {new Date(activity.timestamp).toLocaleString()}
            </p>

            {/* Metadata */}
            {activity.metadata && (
              <div className="text-xs text-white/50 mt-1">
                {activity.metadata.nodeName && (
                  <div>Node: {activity.metadata.nodeName}</div>
                )}
                {activity.metadata.sourceProjectId && (
                  <div>From: {activity.metadata.sourceProjectId}</div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
