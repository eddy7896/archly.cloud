/**
 * Marketplace Page
 * Route: /marketplace
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { Marketplace } from '@/components/Marketplace';

export default async function MarketplacePage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch user's first team membership
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    select: { teamId: true },
  });

  const userTeamId = teamMember?.teamId ?? '';

  return (
    <main>
      <Marketplace userTeamId={userTeamId} userId={session.user.id} />
    </main>
  );
}
