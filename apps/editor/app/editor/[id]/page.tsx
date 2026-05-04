/**
 * Editor Page
 * Route: /editor/[id]
 * Wrapped with CollaborationProvider for real-time sync
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Editor } from '@/components/Editor';
import { CollaborationProvider } from '@/context/CollaborationContext';

interface EditorPageProps {
  params: {
    id: string;
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const session = await auth.api.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // TODO: Fetch project and check user access level
  // For now, assume editor access
  const accessLevel: 'owner' | 'editor' | 'viewer' | 'commenter' = 'editor';

  // User data from session
  const userId = session.user?.id || 'unknown';
  const userName = session.user?.name || 'Anonymous';
  const userColor = generateUserColor(userId);

  return (
    <main>
      <CollaborationProvider
        projectId={params.id}
        userId={userId}
        userName={userName}
        userColor={userColor}
      >
        <Editor projectId={params.id} accessLevel={accessLevel} />
      </CollaborationProvider>
    </main>
  );
}

/**
 * Generate consistent color for user based on ID
 */
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
