/**
 * POST /api/projects/clone - Clone a project (pointer-based duplication)
 *
 * Isolation:
 *   Source project: must exist (public marketplace clone) OR user has viewer+ access.
 *   Target team:    user must be a team member with editor+ role.
 *   yjsBlob is deep-copied. previewImageUrl is shared URL reference.
 *   downloadCount incremented only for marketplace clones.
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cloneProject, incrementDownloadCount } from '@/lib/db-queries';
import {
  getUserProjectRole,
  requireCloneTarget,
  accessErrorResponse,
  PROJECT_ROLES,
  hasMinRole,
} from '@/lib/access-control';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sourceId, teamId, name } = body;

    if (!sourceId || !teamId) {
      return NextResponse.json({ error: 'sourceId and teamId required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Fetch source project with marketplace status
    const source = await prisma.project.findUnique({
      where: { id: sourceId },
      include: { marketplace: true },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source project not found' }, { status: 404 });
    }

    // Source access: marketplace listing (published) OR user has project access
    const isMarketplaceListing = !!source.marketplace?.isPublished;
    if (!isMarketplaceListing) {
      const role = await getUserProjectRole(userId, sourceId);
      if (!role || !hasMinRole(role, PROJECT_ROLES.VIEWER)) {
        return NextResponse.json({ error: 'Source project not accessible' }, { status: 403 });
      }
    }

    // Target team: user must be member with editor+ role
    await requireCloneTarget(userId, teamId);

    const cloneName = name || `Copy of ${source.name}`;
    const cloned = await cloneProject(sourceId, teamId, userId, cloneName);

    if (isMarketplaceListing) {
      await incrementDownloadCount(source.id);
    }

    return NextResponse.json(cloned, { status: 201 });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('POST /api/projects/clone error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
