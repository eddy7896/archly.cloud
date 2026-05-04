/**
 * Marketplace Page
 * Route: /marketplace
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Marketplace } from '@/components/Marketplace';

export default async function MarketplacePage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // TODO: Fetch user's default team
  const userTeamId = 'team_placeholder';

  return (
    <main>
      <Marketplace userTeamId={userTeamId} />
    </main>
  );
}
