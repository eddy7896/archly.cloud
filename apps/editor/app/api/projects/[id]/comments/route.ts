/**
 * GET  /api/projects/[id]/comments - List comments
 * POST /api/projects/[id]/comments - Create comment
 *
 * Isolation:
 *   GET  — viewer+ role
 *   POST — commenter+ role (viewers cannot comment)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProjectComments, createSpatialComment, logActivity } from '@/lib/db-queries';
import {
  requireProjectAccess,
  accessErrorResponse,
  PROJECT_ROLES,
} from '@/lib/access-control';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.VIEWER);

    const comments = await getProjectComments(params.id);
    return NextResponse.json(comments);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('GET /api/projects/[id]/comments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.COMMENTER);

    const body = await req.json();
    const { content, positionX, positionY, positionZ, nodeId } = body;

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const comment = await createSpatialComment(
      params.id,
      session.user.id,
      content,
      positionX ?? 0,
      positionY ?? 0,
      positionZ ?? 0,
      nodeId
    );

    await logActivity('commented', session.user.id, params.id, { commentId: comment.id });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('POST /api/projects/[id]/comments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
