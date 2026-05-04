/**
 * POST   /api/projects/[id]/publish - Publish to marketplace
 * DELETE /api/projects/[id]/publish - Unpublish
 *
 * Isolation: owner or editor role required.
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { publishToMarketplace, unpublishFromMarketplace } from '@/lib/db-queries';
import {
  requireProjectAccess,
  accessErrorResponse,
  PROJECT_ROLES,
} from '@/lib/access-control';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.EDITOR);

    const body = await req.json();
    const { title, description, category, tags } = body;
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const creatorName = session.user.name || 'Anonymous';
    const [, listing] = await publishToMarketplace(
      params.id,
      session.user.id,
      creatorName,
      title,
      description,
      category,
      tags ?? []
    );

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('POST /api/projects/[id]/publish error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.EDITOR);

    await unpublishFromMarketplace(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('DELETE /api/projects/[id]/publish error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
