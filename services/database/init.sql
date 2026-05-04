-- ============================================================================
-- Archly.cloud Database Initialization
-- ============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  billingPlan VARCHAR(50) DEFAULT 'free',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table (multi-tenant workspace subdivision)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_organization ON teams(organizationId);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatarUrl TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Projects table (3D scenes/documents)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teamId UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  yjsDocumentBlob BYTEA, -- Yjs state snapshot
  previewImageUrl TEXT,
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_team ON projects(teamId);
CREATE INDEX idx_projects_published ON projects(isPublished);

-- Project Members (access control)
CREATE TABLE IF NOT EXISTS projectMembers (
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer', -- owner, editor, viewer, commenter
  invitedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (userId, projectId)
);

CREATE INDEX idx_projectMembers_user ON projectMembers(userId);
CREATE INDEX idx_projectMembers_project ON projectMembers(projectId);

-- Yjs Documents Persistence (for collaboration server)
CREATE TABLE IF NOT EXISTS yjs_documents (
  doc_id TEXT PRIMARY KEY,
  state BYTEA NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yjs_documents_updated ON yjs_documents(updated_at);

-- Activity Log (audit trail)
CREATE TABLE IF NOT EXISTS activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
  userId UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_project ON activity(projectId);
CREATE INDEX idx_activity_user ON activity(userId);
CREATE INDEX idx_activity_timestamp ON activity(timestamp);

-- Marketplace Metadata (published projects)
CREATE TABLE IF NOT EXISTS marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creatorId UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  tags TEXT[], -- Array of tags
  downloadCount INT DEFAULT 0,
  rating DECIMAL(3, 2),
  isPublished BOOLEAN DEFAULT TRUE,
  publishedAt TIMESTAMP,
  UNIQUE(projectId)
);

CREATE INDEX idx_marketplace_creator ON marketplace(creatorId);
CREATE INDEX idx_marketplace_published ON marketplace(isPublished);
CREATE INDEX idx_marketplace_category ON marketplace(category);

-- Clone History (track duplications for growth metrics)
CREATE TABLE IF NOT EXISTS cloneHistory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sourceProjectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  targetProjectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  clonedBy UUID NOT NULL REFERENCES users(id),
  clonedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cloneHistory_source ON cloneHistory(sourceProjectId);
CREATE INDEX idx_cloneHistory_target ON cloneHistory(targetProjectId);
CREATE INDEX idx_cloneHistory_user ON cloneHistory(clonedBy);

-- Spatial Comments (optional, for reviewer mode)
CREATE TABLE IF NOT EXISTS spatialComments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projectId UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  position JSONB, -- { x: float, y: float, z: float }
  resolved BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP
);

CREATE INDEX idx_spatialComments_project ON spatialComments(projectId);
CREATE INDEX idx_spatialComments_user ON spatialComments(userId);

-- Enable JSON extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
