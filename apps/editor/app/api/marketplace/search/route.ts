/**
 * GET /api/marketplace/search - Search published projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchMarketplace } from '@/lib/db-queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || undefined;

    const results = await searchMarketplace(query, category);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/marketplace/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
