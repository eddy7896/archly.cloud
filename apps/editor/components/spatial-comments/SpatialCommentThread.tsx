/**
 * Spatial Comment Thread - 3D positioned comments
 */

'use client';

import { useState } from 'react';

interface Comment {
  id: string;
  content: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  resolved: boolean;
}

interface SpatialCommentThreadProps {
  commentId: string;
  comments: Comment[];
  position: { x: number; y: number; z: number };
  onAddReply?: (text: string) => void;
  onResolve?: () => void;
  onDelete?: () => void;
}

export function SpatialCommentThread({
  commentId,
  comments,
  position,
  onAddReply,
  onResolve,
  onDelete,
}: SpatialCommentThreadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || !onAddReply) return;

    setIsReplying(true);
    try {
      await onAddReply(replyText);
      setReplyText('');
    } finally {
      setIsReplying(false);
    }
  };

  const isResolved = comments.some((c) => c.resolved);

  return (
    <div className="absolute flex flex-col gap-2" style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
    }}>
      {/* Comment Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          isOpen
            ? 'bg-blue-500 text-white scale-125'
            : isResolved
            ? 'bg-green-500/20 border border-green-500 text-green-400'
            : 'bg-blue-500/20 border border-blue-500 text-blue-400'
        }`}
        title={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
      >
        {comments.length}
      </button>

      {/* Comment Thread Panel */}
      {isOpen && (
        <div className="absolute left-0 top-10 w-80 bg-white/10 border border-white/20 rounded-lg backdrop-blur-xl shadow-xl z-50">
          <div className="max-h-96 overflow-y-auto">
            {/* Comments */}
            <div className="divide-y divide-white/10">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3">
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      {comment.user.avatarUrl ? (
                        <img
                          src={comment.user.avatarUrl}
                          alt={comment.user.name}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-xs text-white/60">
                          {comment.user.name[0]}
                        </span>
                      )}
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">
                        {comment.user.name}
                      </p>
                      <p className="text-xs text-white/70 mt-1 break-words">
                        {comment.content}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Resolved Badge */}
                    {comment.resolved && (
                      <div className="flex-shrink-0 px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-200 text-xs rounded">
                        ✓ Resolved
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {!isResolved && (
              <div className="p-3 border-t border-white/10">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  className="w-full px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
                  rows={2}
                  disabled={isReplying}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || isReplying}
                    className="flex-1 px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded transition-colors disabled:opacity-50"
                  >
                    {isReplying ? 'Posting...' : 'Reply'}
                  </button>
                  {onResolve && (
                    <button
                      onClick={onResolve}
                      className="flex-1 px-2 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {onDelete && (
              <div className="p-2 border-t border-white/10">
                <button
                  onClick={onDelete}
                  className="w-full px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors"
                >
                  Delete Thread
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
