/**
 * Editor Shell - Wraps Pascal Editor
 * Top bar: project name, presence, share, export
 * Main area: 3D canvas + tools
 * Integrated with Yjs real-time sync & presence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Viewer } from '@pascal-app/viewer';
import { useEditor } from '@pascal-app/editor';
import { projectsApi } from '@/lib/api-client';
import { useCollaboration } from '@/context/CollaborationContext';
import { usePresence } from '@/hooks/usePresence';
import { EditorTopBar } from './editor/EditorTopBar';
import { SelectionTool } from './tools/SelectionTool';
import { TransformTool } from './tools/TransformTool';
import { PresenceCursor } from './presence/PresenceCursor';
import { SelectionHighlight } from './presence/SelectionHighlight';

interface EditorProps {
  projectId: string;
  accessLevel: 'owner' | 'editor' | 'viewer' | 'commenter';
}

export function Editor({ projectId, accessLevel }: EditorProps) {
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const editor = useEditor(projectId);
  const { collab, isConnected } = useCollaboration();
  const { users, updateCursor, updateSelection, setActivity } = usePresence(collab);

  // Load project data & sync with Yjs
  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await projectsApi.get(projectId);
        setProjectData(data);

        // Load initial scene state from Yjs document
        if (collab && isConnected) {
          const sceneState = collab.getScene();
          if (Object.keys(sceneState).length > 0) {
            editor.updateScene(sceneState);
          }
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, collab, isConnected, editor]);

  // Subscribe to Yjs updates
  useEffect(() => {
    if (!collab) return;

    collab.onSceneUpdate((state) => {
      editor.updateScene(state);
    });
  }, [collab, editor]);

  // Update presence when selection changes
  useEffect(() => {
    if (editor.selectedNode && accessLevel !== 'viewer') {
      updateSelection(editor.selectedNode.id);
    }
  }, [editor.selectedNode, accessLevel, updateSelection]);

  // Handle mouse move for cursor tracking
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isConnected && accessLevel !== 'viewer') {
        updateCursor(e.clientX, e.clientY, 0);
      }
    },
    [isConnected, accessLevel, updateCursor]
  );

  // Update activity status
  useEffect(() => {
    setActivity(accessLevel === 'viewer' ? 'viewing' : 'editing');

    return () => {
      setActivity('idle');
    };
  }, [accessLevel, setActivity]);

  if (loading || !projectData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black" onMouseMove={handleMouseMove}>
      {/* Top Bar */}
      <EditorTopBar
        projectName={projectData.name}
        projectId={projectId}
        accessLevel={accessLevel}
        isConnected={isConnected}
        connectedUsers={users}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <Viewer scene={editor.scene} isReadOnly={accessLevel === 'viewer'}>
          {/* Tools are injected as children */}
          {accessLevel !== 'viewer' && (
            <>
              {editor.activeTool === 'selection' && <SelectionTool />}
              {editor.activeTool === 'transform' && <TransformTool />}
            </>
          )}

          {/* Presence overlays (cursors, selections, activity) */}
          <PresenceCursor />
          <SelectionHighlight />
        </Viewer>

        {/* Left Tools Panel (collapsible) */}
        {accessLevel !== 'viewer' && (
          <ToolsPanel
            activeTool={editor.activeTool}
            onToolChange={editor.setActiveTool}
          />
        )}

        {/* Right Inspector Panel (collapsible) */}
        {accessLevel !== 'viewer' && (
          <InspectorPanel selectedNode={editor.selectedNode} />
        )}
      </div>
    </div>
  );
}

/**
 * Top Bar - Project name, presence, share, export
 */
function EditorTopBar({
  projectName,
  projectId,
  accessLevel,
}: {
  projectName: string;
  projectId: string;
  accessLevel: string;
}) {
  return (
    <div className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Left: Project Name */}
      <div>
        <h1 className="text-lg font-semibold text-white">{projectName}</h1>
      </div>

      {/* Center: Presence Avatars */}
      <PresenceAvatars projectId={projectId} />

      {/* Right: Actions */}
      <div className="flex gap-2">
        {accessLevel !== 'viewer' && (
          <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
            Share
          </button>
        )}
        <button className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors">
          Export
        </button>
      </div>
    </div>
  );
}

/**
 * Left Tools Panel
 */
function ToolsPanel({
  activeTool,
  onToolChange,
}: {
  activeTool: string;
  onToolChange: (tool: string) => void;
}) {
  const tools = [
    { id: 'selection', label: 'Select', icon: '👆' },
    { id: 'transform', label: 'Transform', icon: '🔄' },
    { id: 'paint', label: 'Paint', icon: '🎨' },
    { id: 'draw', label: 'Draw', icon: '✏️' },
  ];

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-64px)] w-16 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col items-center pt-4 gap-2">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
          className={`w-12 h-12 rounded flex items-center justify-center text-xl transition-colors ${
            activeTool === tool.id
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

/**
 * Right Inspector Panel
 */
function InspectorPanel({ selectedNode }: { selectedNode: any }) {
  if (!selectedNode) {
    return (
      <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-72 border-l border-white/10 bg-black/50 backdrop-blur-xl p-4">
        <p className="text-white/40 text-sm">Select an object to inspect</p>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-72 border-l border-white/10 bg-black/50 backdrop-blur-xl p-4 overflow-y-auto">
      <h3 className="font-semibold text-white mb-4">{selectedNode.name}</h3>
      <div className="space-y-4 text-sm">
        {/* Add property inspectors here */}
        <div>
          <label className="block text-white/60 mb-1">Type</label>
          <div className="text-white">{selectedNode.type}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Presence Avatars - Show connected users
 */
function PresenceAvatars({ projectId }: { projectId: string }) {
  return (
    <div className="flex gap-2">
      {/* Placeholder: Add presence integration */}
      <div className="flex -space-x-2">
        {/* Active user avatars would go here */}
      </div>
    </div>
  );
}

/**
 * Presence Overlay - Render cursor badges, activity
 */
function PresenceOverlay({ projectId }: { projectId: string }) {
  return null; // Placeholder for presence rendering
}
