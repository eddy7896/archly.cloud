/**
 * Dashboard - Figma-style Project Browser
 * Left sidebar: Org > Team > Projects
 * Main area: Project cards with preview
 */

'use client';

import { useState, useEffect } from 'react';
import { projectsApi, teamsApi } from '@/lib/api-client';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { PublishModal } from './modals/PublishModal';

interface Team {
  id: string;
  name: string;
  organizationId: string;
}

interface Project {
  id: string;
  teamId: string;
  name: string;
  previewImageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export function Dashboard({ organizationId }: { organizationId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishingProjectId, setPublishingProjectId] = useState<string | null>(null);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamsApi.list(organizationId);
        setTeams(data);
        if (data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [organizationId]);

  // Fetch projects for selected team
  useEffect(() => {
    if (!selectedTeamId) return;

    const fetchProjects = async () => {
      try {
        const data = await projectsApi.list(selectedTeamId);
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, [selectedTeamId]);

  const handleCreateProject = async (name: string, description?: string) => {
    if (!selectedTeamId) return;

    try {
      const newProject = await projectsApi.create({
        teamId: selectedTeamId,
        name,
        description,
      });
      setProjects([...projects, newProject]);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleUnpublishProject = async (projectId: string) => {
    try {
      await projectsApi.unpublish(projectId);
      setProjects(
        projects.map((p) =>
          p.id === projectId ? { ...p, isPublished: false } : p
        )
      );
    } catch (error) {
      console.error('Failed to unpublish project:', error);
    }
  };

  const handleOpenPublishModal = (projectId: string) => {
    setPublishingProjectId(projectId);
    setPublishModalOpen(true);
  };

  const handlePublished = () => {
    if (publishingProjectId) {
      setProjects(
        projects.map((p) =>
          p.id === publishingProjectId ? { ...p, isPublished: true } : p
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Teams</h2>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
                selectedTeamId === team.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {team.name}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="m-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {teams.find((t) => t.id === selectedTeamId)?.name || 'Projects'}
            </h1>
            <p className="text-white/60">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Project Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={() => handleDeleteProject(project.id)}
                  onPublish={() => handleOpenPublishModal(project.id)}
                  onUnpublish={() => handleUnpublishProject(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-white/40 mb-4">📁</div>
              <h3 className="text-lg font-medium text-white mb-2">
                No projects yet
              </h3>
              <p className="text-white/60 mb-6">
                Create your first project to get started
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Publish Modal */}
      {publishModalOpen && publishingProjectId && (
        <PublishModal
          projectId={publishingProjectId}
          projectName={
            projects.find((p) => p.id === publishingProjectId)?.name ||
            'Project'
          }
          onClose={() => {
            setPublishModalOpen(false);
            setPublishingProjectId(null);
          }}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
