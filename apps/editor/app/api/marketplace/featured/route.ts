/**
 * GET /api/marketplace/featured - Get featured projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedProjects } from '@/lib/db-queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const featured = await getFeaturedProjects(limit);

    return NextResponse.json(featured);
  } catch (error) {
    console.error('GET /api/marketplace/featured error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
