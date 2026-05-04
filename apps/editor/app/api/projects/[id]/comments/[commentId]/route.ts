/**
 * DELETE /api/projects/[id]/comments/[commentId] - Delete comment
 * POST /api/projects/[id]/comments/[commentId]/resolve - Resolve comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteSpatialComment, resolveSpatialComment } from '@/lib/db-queries';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.commentId;

    await deleteSpatialComment(commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/comments/[commentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();

    if (action !== 'resolve') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const comment = await resolveSpatialComment(params.commentId);
    return NextResponse.json(comment);
  } catch (error) {
    console.error('POST /api/comments/[commentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
