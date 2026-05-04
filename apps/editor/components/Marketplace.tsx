/**
 * Marketplace - Community gallery for published projects
 * Search, filter, clone, creator profiles
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { marketplaceApi, projectsApi } from '@/lib/api-client';

interface MarketplaceProject {
  id: string;
  name: string;
  title: string;
  description: string;
  previewImageUrl?: string;
  creatorId: string;
  creatorName: string;
  category: string;
  tags: string[];
  downloadCount: number;
  rating: number;
}

export function Marketplace({
  userTeamId,
  userId,
}: {
  userTeamId: string;
  userId: string;
}) {
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [featured, setFeatured] = useState<MarketplaceProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Fetch featured projects
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await marketplaceApi.getFeatured();
        setFeatured(data);
      } catch (error) {
        console.error('Failed to fetch featured:', error);
      }
    };

    fetchFeatured();
  }, []);

  // Search/filter projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await marketplaceApi.search(
          searchQuery,
          selectedCategory
        );
        setProjects(data);
      } catch (error) {
        console.error('Failed to search projects:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleClone = async (sourceProjectId: string, title: string) => {
    setCloning(sourceProjectId);
    try {
      const cloned = await projectsApi.clone(
        sourceProjectId,
        userTeamId,
        `Copy of ${title}`
      );
      setNotification({
        type: 'success',
        msg: `Cloned "${title}" to your drafts!`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Failed to clone project:', error);
      setNotification({
        type: 'error',
        msg: 'Failed to clone project',
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setCloning(null);
    }
  };

  const categories = ['Parametric', 'Lighting', 'Furniture', 'Architecture'];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded border z-50 ${
            notification.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-6">Marketplace</h1>

          {/* Search & Filter */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat ? '' : cat
                    )
                  }
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Featured</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featured.slice(0, 3).map((project) => (
              <MarketplaceCard
                key={project.id}
                project={project}
                onClone={() => handleClone(project.id, project.title)}
                isCloning={cloning === project.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          {searchQuery || selectedCategory
            ? 'Search Results'
            : 'Latest Projects'}
        </h2>

        {loading ? (
          <div className="text-center text-white/40">Loading...</div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <MarketplaceCard
                key={project.id}
                project={project}
                onClone={() => handleClone(project.id, project.title)}
                isCloning={cloning === project.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            No projects found. Try a different search.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Marketplace Project Card
 */
function MarketplaceCard({
  project,
  onClone,
  isCloning,
}: {
  project: MarketplaceProject;
  onClone: () => void;
  isCloning: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-all group">
      {/* Image */}
      <div className="relative w-full h-48 bg-gradient-to-br from-white/5 to-white/10 overflow-hidden">
        {project.previewImageUrl && (
          <img
            src={project.previewImageUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onClone}
            disabled={isCloning}
            className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isCloning ? 'Cloning...' : '📋 Clone'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{project.title}</h3>
        <p className="text-sm text-white/60 mb-3 line-clamp-2">
          {project.description}
        </p>

        {/* Creator & Stats */}
        <div className="flex items-center justify-between text-xs text-white/40 mb-3">
          <Link
            href={`/marketplace/creators/${project.creatorId}`}
            className="hover:text-white/60 transition-colors"
          >
            By {project.creatorName}
          </Link>
          <div className="flex gap-2">
            <span>⭐ {(project.rating ?? 0).toFixed(1)}</span>
            <span>📥 {project.downloadCount}</span>
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {project.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="px-2 py-1 text-white/40 text-xs">
                +{project.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
