/**
 * GET /api/marketplace/[id] - Get marketplace listing detail (public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceListing } from '@/lib/db-queries';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await getMarketplaceListing(params.id);

    if (!listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('GET /api/marketplace/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
