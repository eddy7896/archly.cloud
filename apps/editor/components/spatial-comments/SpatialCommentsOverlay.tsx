/**
 * Spatial Comments Overlay
 * Render all comments on canvas, handle creation
 */

'use client';

import { useState, useEffect } from 'react';
import { SpatialCommentThread } from './SpatialCommentThread';

interface CommentData {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  nodeId?: string;
  resolved: boolean;
  user: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface SpatialCommentsOverlayProps {
  projectId: string;
  isReadOnly?: boolean;
}

export function SpatialCommentsOverlay({
  projectId,
  isReadOnly = false,
}: SpatialCommentsOverlayProps) {
  const [comments, setComments] = useState<Record<string, CommentData[]>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createPosition, setCreatePosition] = useState<{ x: number; y: number } | null>(null);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/comments`
        );
        const data = await response.json();

        // Group by position for thread display
        const grouped: Record<string, CommentData[]> = {};
        data.forEach((comment: CommentData) => {
          const key = `${comment.positionX},${comment.positionY}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(comment);
        });

        setComments(grouped);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [projectId]);

  // Handle canvas click to create comment
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || creating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCreatePosition({ x, y });
    setCreating(true);
  };

  const handleCreateComment = async (text: string) => {
    if (!createPosition) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: text,
            positionX: createPosition.x,
            positionY: createPosition.y,
            positionZ: 0,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create comment');

      const newComment = await response.json();

      // Add to local state
      const key = `${createPosition.x},${createPosition.y}`;
      setComments((prev) => ({
        ...prev,
        [key]: [newComment, ...(prev[key] || [])],
      }));

      setCreatePosition(null);
      setCreating(false);
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleResolveComment = async (commentId: string, key: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments/${commentId}/resolve`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to resolve');

      // Update local state
      setComments((prev) => ({
        ...prev,
        [key]: prev[key].map((c) =>
          c.id === commentId ? { ...c, resolved: true } : c
        ),
      }));
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleDeleteThread = async (key: string) => {
    try {
      // Delete all comments in thread
      for (const comment of comments[key]) {
        await fetch(
          `/api/projects/${projectId}/comments/${comment.id}`,
          { method: 'DELETE' }
        );
      }

      setComments((prev) => {
        const newComments = { ...prev };
        delete newComments[key];
        return newComments;
      });
    } catch (error) {
      console.error('Failed to delete comments:', error);
    }
  };

  if (loading) return null;

  return (
    <div
      onClick={handleCanvasClick}
      className="absolute inset-0 pointer-events-auto cursor-crosshair"
      title={isReadOnly ? '' : 'Click to add comment'}
    >
      {/* Render comment threads */}
      {Object.entries(comments).map(([key, threadComments]) => {
        const [x, y] = key.split(',').map(Number);
        return (
          <SpatialCommentThread
            key={key}
            commentId={threadComments[0].id}
            comments={threadComments}
            position={{ x, y, z: 0 }}
            onAddReply={!isReadOnly ? (text) => handleCreateComment(text) : undefined}
            onResolve={!isReadOnly ? () => handleResolveComment(threadComments[0].id, key) : undefined}
            onDelete={!isReadOnly ? () => handleDeleteThread(key) : undefined}
          />
        );
      })}

      {/* Creating hint */}
      {creating && createPosition && (
        <div
          className="absolute w-4 h-4 border-2 border-blue-500 rounded-full opacity-50"
          style={{
            left: `${createPosition.x - 8}px`,
            top: `${createPosition.y - 8}px`,
          }}
        />
      )}
    </div>
  );
}
