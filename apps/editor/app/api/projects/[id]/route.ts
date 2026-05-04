/**
 * GET    /api/projects/[id] - Get project details
 * PATCH  /api/projects/[id] - Update project metadata
 * DELETE /api/projects/[id] - Delete project
 *
 * Isolation:
 *   GET    — viewer+ role required
 *   PATCH  — editor+ role required
 *   DELETE — owner role required
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { updateProject, deleteProject, logActivity } from '@/lib/db-queries';
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

    const { project } = await requireProjectAccess(
      session.user.id,
      params.id,
      PROJECT_ROLES.VIEWER
    );

    return NextResponse.json(project);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('GET /api/projects/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.EDITOR);

    const body = await req.json();
    const { name, description, previewImageUrl } = body;

    const updated = await updateProject(params.id, { name, description, previewImageUrl });

    await logActivity('updated_project', session.user.id, params.id, { name });

    return NextResponse.json(updated);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('PATCH /api/projects/[id] error:', err);
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

    await requireProjectAccess(session.user.id, params.id, PROJECT_ROLES.OWNER);

    await deleteProject(params.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('DELETE /api/projects/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
