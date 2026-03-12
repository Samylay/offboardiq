import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const interview = await db('interviews')
      .join('departures', 'interviews.departure_id', 'departures.id')
      .where({ 'interviews.id': id, 'departures.org_id': user.orgId })
      .select('interviews.*')
      .first();

    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    interview.messages = JSON.parse(interview.messages || '[]');
    return NextResponse.json(interview);
  });
}
