import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { generateProactiveRecommendations } from '@/lib/services/flightRiskEngine';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const data = await generateProactiveRecommendations(user.orgId);
    return NextResponse.json(data);
  });
}
