/**
 * GET /api/projects/[id]/activity - Get project activity log
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProjectActivity } from '@/lib/db-queries';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const activities = await getProjectActivity(projectId, limit);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('GET /api/projects/[id]/activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
