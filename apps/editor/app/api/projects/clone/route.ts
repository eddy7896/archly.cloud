/**
 * POST /api/projects/clone - Clone a project (pointer-based duplication)
 * Copies yjsBlob (scene state), shares previewImageUrl (R2 reference)
 * Increments downloadCount if cloning from a marketplace listing
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cloneProject, incrementDownloadCount } from '@/lib/db-queries';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sourceId, teamId, name } = body;

    if (!sourceId || !teamId) {
      return NextResponse.json(
        { error: 'sourceId and teamId required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch source project with marketplace listing status
    const source = await prisma.project.findUnique({
      where: { id: sourceId },
      include: { marketplace: true },
    });

    if (!source) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Clone the project (yjsBlob deep-copied, previewImageUrl shared)
    const cloneName = name || `Copy of ${source.name}`;
    const cloned = await cloneProject(sourceId, teamId, userId, cloneName);

    // Increment download count if source is in marketplace
    if (source.marketplace) {
      await incrementDownloadCount(source.id);
    }

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/clone error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
