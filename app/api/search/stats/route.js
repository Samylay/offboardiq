import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { getOrgKnowledgeStats } from '@/lib/services/knowledgeSearch';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const stats = await getOrgKnowledgeStats(user.orgId);
    return NextResponse.json(stats);
  });
}
