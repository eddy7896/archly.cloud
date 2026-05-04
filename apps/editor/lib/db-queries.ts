/**
 * Database Query Helpers
 * Safe wrappers around Prisma queries
 */

import prisma from './db';

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjectsByTeam(teamId: string) {
  return prisma.project.findMany({
    where: { teamId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      marketplace: true,
      activity: { take: 10, orderBy: { timestamp: 'desc' } },
    },
  });
}

export async function createProject(
  teamId: string,
  name: string,
  userId: string,
  description?: string
) {
  return prisma.project.create({
    data: {
      teamId,
      name,
      description,
      members: {
        create: { userId, role: 'owner' },
      },
    },
  });
}

export async function updateProject(
  projectId: string,
  data: { name?: string; description?: string; previewImageUrl?: string }
) {
  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({
    where: { id: projectId },
  });
}

export async function saveYjsBlob(projectId: string, blob: Buffer) {
  return prisma.project.update({
    where: { id: projectId },
    data: { yjsDocumentBlob: blob },
  });
}

export async function getYjsBlob(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { yjsDocumentBlob: true },
  });
  return project?.yjsDocumentBlob;
}

// ============================================================================
// PROJECT MEMBERS & ACCESS CONTROL
// ============================================================================

export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<string | null> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return member?.role || null;
}

export async function addProjectMember(
  projectId: string,
  userId: string,
  role: string = 'viewer'
) {
  return prisma.projectMember.create({
    data: { projectId, userId, role },
  });
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: string
) {
  return prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
}

// ============================================================================
// SPATIAL COMMENTS
// ============================================================================

export async function createSpatialComment(
  projectId: string,
  userId: string,
  content: string,
  positionX: number,
  positionY: number,
  positionZ: number,
  nodeId?: string
) {
  return prisma.spatialComment.create({
    data: {
      projectId,
      userId,
      content,
      positionX,
      positionY,
      positionZ,
      nodeId,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

export async function getProjectComments(projectId: string) {
  return prisma.spatialComment.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveSpatialComment(commentId: string) {
  return prisma.spatialComment.update({
    where: { id: commentId },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

export async function deleteSpatialComment(commentId: string) {
  return prisma.spatialComment.delete({
    where: { id: commentId },
  });
}

export async function getCommentsByNode(projectId: string, nodeId: string) {
  return prisma.spatialComment.findMany({
    where: { projectId, nodeId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export async function logActivity(
  action: string,
  userId?: string,
  projectId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  return prisma.activityLog.create({
    data: {
      action,
      userId,
      projectId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
}

export async function getProjectActivity(
  projectId: string,
  limit: number = 50
) {
  return prisma.activityLog.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

export async function getUserActivity(userId: string, limit: number = 50) {
  return prisma.activityLog.findMany({
    where: { userId },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

export async function getActivitySince(
  projectId: string,
  since: Date,
  limit: number = 100
) {
  return prisma.activityLog.findMany({
    where: {
      projectId,
      timestamp: { gte: since },
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

// ============================================================================
// MARKETPLACE
// ============================================================================

export async function publishToMarketplace(
  projectId: string,
  title: string,
  description?: string,
  category?: string,
  tags: string[] = []
) {
  return prisma.marketplace.create({
    data: {
      projectId,
      title,
      description,
      category,
      tags,
      creatorId: 'unknown', // TODO: Get from session
      isPublished: true,
    },
  });
}

export async function unpublishFromMarketplace(projectId: string) {
  return prisma.marketplace.update({
    where: { projectId },
    data: { isPublished: false },
  });
}

export async function searchMarketplace(query: string, category?: string) {
  return prisma.marketplace.findMany({
    where: {
      isPublished: true,
      AND: [
        {
          OR: [
            { title: { search: query } },
            { description: { search: query } },
            { tags: { hasSome: [query] } },
          ],
        },
        category ? { category } : {},
      ],
    },
    include: {
      project: { select: { id: true, name: true, previewImageUrl: true } },
    },
    orderBy: [{ downloadCount: 'desc' }, { rating: 'desc' }],
    take: 20,
  });
}

export async function getFeaturedProjects(limit: number = 10) {
  return prisma.marketplace.findMany({
    where: { isPublished: true },
    include: {
      project: { select: { id: true, name: true, previewImageUrl: true } },
    },
    orderBy: [{ downloadCount: 'desc' }, { rating: 'desc' }],
    take: limit,
  });
}

// ============================================================================
// CLONING
// ============================================================================

export async function cloneProject(
  sourceProjectId: string,
  targetTeamId: string,
  userId: string,
  name: string
) {
  const sourceProject = await getProject(sourceProjectId);
  if (!sourceProject) throw new Error('Source project not found');

  // Create new project with cloned Yjs state
  const clonedProject = await prisma.project.create({
    data: {
      teamId: targetTeamId,
      name,
      yjsDocumentBlob: sourceProject.yjsDocumentBlob,
      previewImageUrl: sourceProject.previewImageUrl,
      members: {
        create: { userId, role: 'owner' },
      },
    },
  });

  // Record clone history
  await prisma.cloneHistory.create({
    data: {
      sourceProjectId,
      targetProjectId: clonedProject.id,
      clonedById: userId,
    },
  });

  // Log activity
  await logActivity(
    'cloned_project',
    userId,
    clonedProject.id,
    { sourceProjectId }
  );

  return clonedProject;
}

export async function getCloneHistory(projectId: string) {
  return prisma.cloneHistory.findMany({
    where: { targetProjectId: projectId },
    include: {
      sourceProject: { select: { id: true, name: true } },
      clonedBy: { select: { id: true, name: true } },
    },
  });
}
