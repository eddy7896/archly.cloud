/**
 * GET /api/projects/[id]/activity - Get project activity log
 *
 * Isolation: viewer+ role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProjectActivity } from '@/lib/db-queries';
import { requireProjectAccess, accessErrorResponse, PROJECT_ROLES } from '@/lib/access-control';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.VIEWER);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const activities = await getProjectActivity(params.id, limit);
    return NextResponse.json(activities);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('GET /api/projects/[id]/activity error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
