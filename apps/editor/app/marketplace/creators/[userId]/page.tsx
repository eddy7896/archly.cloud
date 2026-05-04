/**
 * Creator Profile Page
 * Route: /marketplace/creators/[userId]
 * Shows creator info and all their published projects
 */

import { getCreatorListings } from '@/lib/db-queries';
import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CreatorProfilePageProps {
  params: { userId: string };
}

export default async function CreatorProfilePage({
  params,
}: CreatorProfilePageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, avatarUrl: true, createdAt: true },
  });

  if (!user) {
    notFound();
  }

  const listings = await getCreatorListings(params.userId);
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Creator Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'Creator'}
                className="w-24 h-24 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-3xl">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                {user.name || 'Creator'}
              </h1>
              <p className="text-white/60 mb-4">
                Joined {joinedDate} • {listings.length} published project
                {listings.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Back Link */}
            <Link
              href="/marketplace"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {listings.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">
              Published Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-white/5 to-white/10 overflow-hidden">
                    {listing.project?.previewImageUrl && (
                      <img
                        src={listing.project.previewImageUrl}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-2 text-xs text-white/40">
                      <span>⭐ {(listing.rating ?? 0).toFixed(1)}</span>
                      <span>📥 {listing.downloadCount}</span>
                    </div>

                    {/* Tags */}
                    {listing.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-3">
                        {listing.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-white/40">
            <div className="text-4xl mb-3">📭</div>
            <p>No published projects yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
