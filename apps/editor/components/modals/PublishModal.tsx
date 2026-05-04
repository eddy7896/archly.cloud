'use client';

import { useState } from 'react';
import { projectsApi } from '@/lib/api-client';

const CATEGORIES = ['Parametric', 'Lighting', 'Furniture', 'Architecture'];

interface PublishModalProps {
  projectId: string;
  projectName: string;
  existingListing?: {
    title: string;
    description?: string;
    category?: string;
    tags: string[];
  } | null;
  onClose: () => void;
  onPublished: () => void;
}

export function PublishModal({
  projectId,
  projectName,
  existingListing,
  onClose,
  onPublished,
}: PublishModalProps) {
  const [title, setTitle] = useState(existingListing?.title || projectName || '');
  const [description, setDescription] = useState(existingListing?.description || '');
  const [category, setCategory] = useState(existingListing?.category || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(existingListing?.tags || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await projectsApi.publish(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        tags,
      });
      onPublished();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-lg max-w-md w-full border border-white/10">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {existingListing ? 'Update Listing' : 'Publish to Marketplace'}
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Amazing Architecture"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/30"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-white/60 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-white/10 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-white/60 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-white/90 transition-colors font-medium disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
