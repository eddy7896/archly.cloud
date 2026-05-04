/**
 * Collaboration Context
 * Provides Yjs document and presence to entire app
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  CollaborationManager,
  createCollaborationManager,
} from '@/lib/collab';

interface CollaborationContextType {
  collab: CollaborationManager | null;
  isConnected: boolean;
  projectId: string | null;
}

const CollaborationContext = createContext<CollaborationContextType>({
  collab: null,
  isConnected: false,
  projectId: null,
});

export function CollaborationProvider({
  children,
  projectId,
  userId,
  userName,
  userColor,
}: {
  children: ReactNode;
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
}) {
  const [collab, setCollab] = useState<CollaborationManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create collaboration manager
    const manager = createCollaborationManager();

    // Connect to collab server
    manager.connect(projectId, userId, userName, userColor);
    setCollab(manager);

    // Monitor connection
    const checkConnection = () => {
      setIsConnected(manager.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      manager.disconnect();
    };
  }, [projectId, userId, userName, userColor]);

  return (
    <CollaborationContext.Provider
      value={{
        collab,
        isConnected,
        projectId,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration(): CollaborationContextType {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaboration must be used within CollaborationProvider'
    );
  }
  return context;
}
