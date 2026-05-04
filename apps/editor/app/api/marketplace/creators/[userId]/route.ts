/**
 * GET /api/marketplace/creators/[userId] - Get creator profile + listings (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCreatorListings } from '@/lib/db-queries';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, avatarUrl: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const listings = await getCreatorListings(params.userId);

    return NextResponse.json({ creator: user, listings });
  } catch (error) {
    console.error('GET /api/marketplace/creators/[userId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
