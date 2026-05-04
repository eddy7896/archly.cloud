/**
 * DELETE /api/projects/[id]/comments/[commentId] - Delete comment
 * POST   /api/projects/[id]/comments/[commentId] - Resolve comment (action: 'resolve')
 *
 * Isolation:
 *   DELETE — comment owner OR project editor+
 *   POST   — comment owner OR project editor+
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteSpatialComment, resolveSpatialComment } from '@/lib/db-queries';
import {
  requireCommentAccess,
  accessErrorResponse,
} from '@/lib/access-control';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireCommentAccess(session.user.id, params.commentId, params.id);

    await deleteSpatialComment(params.commentId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('DELETE /api/comments/[commentId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireCommentAccess(session.user.id, params.commentId, params.id);

    const { action } = await req.json();
    if (action !== 'resolve') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const comment = await resolveSpatialComment(params.commentId);
    return NextResponse.json(comment);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('POST /api/comments/[commentId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
