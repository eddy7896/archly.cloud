/**
 * RBAC access control helpers for API routes.
 *
 * Role hierarchy (most → least privileged):
 *   owner > editor > commenter > viewer
 *
 * Project roles:  owner | editor | viewer | commenter
 * Team roles:     owner | editor | member
 */

import prisma from './db';

// ============================================================================
// CONSTANTS
// ============================================================================

export const PROJECT_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  COMMENTER: 'commenter',
  VIEWER: 'viewer',
} as const;

export type ProjectRole = (typeof PROJECT_ROLES)[keyof typeof PROJECT_ROLES];

const ROLE_RANK: Record<string, number> = {
  owner: 4,
  editor: 3,
  commenter: 2,
  viewer: 1,
};

/** Returns true if `role` meets the minimum required role. */
export function hasMinRole(role: string, minimum: ProjectRole): boolean {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

// ============================================================================
// TEAM MEMBERSHIP
// ============================================================================

/** Verify user is a member of the given team. Returns the team-member role or null. */
export async function getUserTeamRole(
  userId: string,
  teamId: string
): Promise<string | null> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}

/** Throws 403-style error if user is not a member of the team. */
export async function requireTeamMember(
  userId: string,
  teamId: string
): Promise<string> {
  const role = await getUserTeamRole(userId, teamId);
  if (!role) throw new AccessError('Not a member of this team', 403);
  return role;
}

// ============================================================================
// PROJECT MEMBERSHIP
// ============================================================================

/** Returns the user's project role, or null if no access. */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return (member?.role as ProjectRole) ?? null;
}

/**
 * Fetch project and verify:
 *   1. Project exists.
 *   2. User has the minimum required project role.
 *
 * Returns the full project row.
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string,
  minimum: ProjectRole = PROJECT_ROLES.VIEWER
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true, role: true } } },
  });

  if (!project) throw new AccessError('Project not found', 404);

  const member = project.members.find((m) => m.userId === userId);
  const role = member?.role as ProjectRole | undefined;

  if (!role) throw new AccessError('Forbidden', 403);
  if (!hasMinRole(role, minimum)) throw new AccessError('Insufficient role', 403);

  return { project, role };
}

// ============================================================================
// COMMENT OWNERSHIP
// ============================================================================

/**
 * Verify user owns the comment or has owner/editor role on the project.
 * Used for delete/resolve operations.
 */
export async function requireCommentAccess(
  userId: string,
  commentId: string,
  projectId: string
) {
  const [comment, projectRole] = await Promise.all([
    prisma.spatialComment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    }),
    getUserProjectRole(userId, projectId),
  ]);

  if (!comment) throw new AccessError('Comment not found', 404);
  if (!projectRole) throw new AccessError('Forbidden', 403);

  const isOwner = comment.userId === userId;
  const canModerate = hasMinRole(projectRole, PROJECT_ROLES.EDITOR);

  if (!isOwner && !canModerate) {
    throw new AccessError('Cannot modify others\' comments', 403);
  }
}

// ============================================================================
// CLONE TARGET VERIFICATION
// ============================================================================

/** Verify user is a member of the target team before cloning into it. */
export async function requireCloneTarget(userId: string, targetTeamId: string) {
  const role = await getUserTeamRole(userId, targetTeamId);
  if (!role) throw new AccessError('Not a member of target team', 403);
  // Team viewers cannot create projects
  if (role === 'member') throw new AccessError('Insufficient team role to create projects', 403);
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class AccessError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'AccessError';
  }
}

/** Convert an AccessError to a NextResponse-compatible shape. */
export function accessErrorResponse(err: unknown): { error: string; status: number } | null {
  if (err instanceof AccessError) {
    return { error: err.message, status: err.status };
  }
  return null;
}
