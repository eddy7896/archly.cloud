/**
 * POST /api/projects/clone - Clone a project
 * Pointer-based duplication (shares R2 URLs, not file copies)
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sourceId, teamId } = body;

    if (!sourceId || !teamId) {
      return NextResponse.json(
        { error: 'sourceId and teamId required' },
        { status: 400 }
      );
    }

    // TODO: Fetch source project
    // TODO: Copy yjsDocumentBlob (document state)
    // TODO: Create new project with cloned state
    // TODO: Record clone in cloneHistory table
    // TODO: Assets (R2 URLs) are shared, not duplicated

    const clonedProject = {
      id: 'proj_' + Date.now(),
      teamId,
      name: 'Copy of Source Project',
      yjsDocumentBlob: null, // TODO: copy from source
      previewImageUrl: null,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(clonedProject, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/clone error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
