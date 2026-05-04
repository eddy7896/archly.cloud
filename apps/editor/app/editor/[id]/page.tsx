/**
 * Editor Page
 * Route: /editor/[id]
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Editor } from '@/components/Editor';

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
  const accessLevel: 'owner' | 'editor' | 'viewer' | 'commenter' =
    'editor';

  return (
    <main>
      <Editor projectId={params.id} accessLevel={accessLevel} />
    </main>
  );
}
