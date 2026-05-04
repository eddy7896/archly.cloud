/**
 * GET /api/projects/[id]/comments - Get all comments
 * POST /api/projects/[id]/comments - Create comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getProjectComments,
  createSpatialComment,
  getUserProjectRole,
} from '@/lib/db-queries';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const comments = await getProjectComments(projectId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('GET /api/projects/[id]/comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;
    const userId = session.user?.id;

    // Check user has access to project (at least viewer)
    const role = await getUserProjectRole(userId, projectId);
    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { content, positionX, positionY, positionZ, nodeId } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    const comment = await createSpatialComment(
      projectId,
      userId,
      content,
      positionX || 0,
      positionY || 0,
      positionZ || 0,
      nodeId
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
