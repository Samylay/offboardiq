import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { computeKnowledgeConcentrationMap } from '@/lib/services/flightRiskEngine';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const map = await computeKnowledgeConcentrationMap(user.orgId);
    return NextResponse.json(map);
  });
}
