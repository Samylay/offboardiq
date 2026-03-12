import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { computeRiskScore } from '@/lib/services/riskEngine';

export async function POST(request, { params }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const assessment = await computeRiskScore(id);
      return NextResponse.json(assessment);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  });
}
