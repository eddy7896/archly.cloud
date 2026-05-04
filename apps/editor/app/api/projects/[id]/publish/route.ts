/**
 * POST /api/projects/[id]/publish — Publish project to marketplace
 * DELETE /api/projects/[id]/publish — Unpublish from marketplace
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  publishToMarketplace,
  unpublishFromMarketplace,
  getUserProjectRole,
} from '@/lib/db-queries';

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
    const role = await getUserProjectRole(session.user.id, projectId);

    if (!role || !['owner', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, tags } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'title required' },
        { status: 400 }
      );
    }

    const creatorName = session.user.name || 'Anonymous';
    const [, listing] = await publishToMarketplace(
      projectId,
      session.user.id,
      creatorName,
      title,
      description,
      category,
      tags ?? []
    );

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[id]/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const role = await getUserProjectRole(session.user.id, projectId);

    if (!role || !['owner', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await unpublishFromMarketplace(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id]/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
