/**
 * GET /api/projects - List projects for a team
 * POST /api/projects - Create new project
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId required' },
        { status: 400 }
      );
    }

    // TODO: Fetch projects from database where teamId = teamId
    // Filter by user permissions (member role)
    const projects = []; // Placeholder

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, name, description } = body;

    if (!teamId || !name) {
      return NextResponse.json(
        { error: 'teamId and name required' },
        { status: 400 }
      );
    }

    // TODO: Create project in database
    // Initialize with empty Yjs document
    // Add user as OWNER

    const project = {
      id: 'proj_' + Date.now(),
      teamId,
      name,
      description,
      yjsDocumentBlob: null,
      previewImageUrl: null,
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
