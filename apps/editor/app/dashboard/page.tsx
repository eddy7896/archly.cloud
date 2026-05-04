/**
 * Dashboard Page
 * Route: /dashboard
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';

export default async function DashboardPage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // TODO: Fetch user's default organization
  // For now, use a placeholder
  const organizationId = 'org_placeholder';

  return (
    <main>
      <Dashboard organizationId={organizationId} />
    </main>
  );
}
