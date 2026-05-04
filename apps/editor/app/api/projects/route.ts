/**
 * GET /api/projects?teamId=... - List projects for a team
 * POST /api/projects          - Create new project
 *
 * Isolation:
 *   GET  — user must be a TeamMember of the requested team.
 *   POST — user must be a TeamMember with role owner|editor.
 *          New project gets the creator added as ProjectMember(owner).
 */

import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getProjectsByTeam, createProject } from '@/lib/db-queries';
import {
  requireTeamMember,
  accessErrorResponse,
  hasMinRole,
  PROJECT_ROLES,
} from '@/lib/access-control';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'teamId required' }, { status: 400 });
    }

    // Verify user belongs to the requested team
    await requireTeamMember(session.user.id, teamId);

    const projects = await getProjectsByTeam(teamId);
    return NextResponse.json(projects);
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('GET /api/projects error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { teamId, name, description } = body;

    if (!teamId || !name) {
      return NextResponse.json({ error: 'teamId and name required' }, { status: 400 });
    }

    // Verify user belongs to the team and has sufficient role (owner or editor)
    const teamRole = await requireTeamMember(session.user.id, teamId);
    if (!hasMinRole(teamRole, PROJECT_ROLES.EDITOR)) {
      return NextResponse.json(
        { error: 'Insufficient team role to create projects' },
        { status: 403 }
      );
    }

    // Creates project + adds creator as ProjectMember(owner)
    const project = await createProject(teamId, name, session.user.id, description);

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    const access = accessErrorResponse(err);
    if (access) return NextResponse.json({ error: access.error }, { status: access.status });
    console.error('POST /api/projects error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
