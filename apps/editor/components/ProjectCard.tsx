/**
 * Project Card - Dashboard Grid Item
 * Shows thumbnail, name, last edited, actions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    previewImageUrl?: string;
    updatedAt: string;
    isPublished: boolean;
  };
  onDelete?: () => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const lastEdited = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-all">
      {/* Thumbnail Area */}
      <div
        className="relative w-full h-48 bg-gradient-to-br from-white/5 to-white/10 cursor-pointer overflow-hidden"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {showPreview && project.previewImageUrl ? (
          // 3D Preview (low-poly rotating model)
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Environment preset="neutral" />
            {/* Add 3D preview model here */}
          </Canvas>
        ) : project.previewImageUrl ? (
          // Static Image Preview
          <img
            src={project.previewImageUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <div className="text-center">
              <div className="text-4xl mb-2">🏗️</div>
              <div className="text-sm">No preview</div>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link
            href={`/editor/${project.id}`}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium transition-colors"
          >
            Open
          </Link>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (confirm(`Delete "${project.name}"?`)) {
                  onDelete();
                }
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-sm font-medium transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Published Badge */}
        {project.isPublished && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-200 text-xs rounded-full">
            Published
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">
          {project.name}
        </h3>
        <p className="text-xs text-white/40">Edited {lastEdited}</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Actions */}
      <div className="p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
          Share
        </button>
        <button className="flex-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
          Export
        </button>
      </div>
    </div>
  );
}
