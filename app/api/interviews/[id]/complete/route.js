import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const [interview] = await db('interviews').where({ id }).update({
      status: 'completed', completed_at: new Date(), updated_at: new Date(),
    }).returning('*');

    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

    const itemsCount = await db('knowledge_items').where({ interview_id: id }).count().first();

    return NextResponse.json({ ...interview, itemsCaptured: +itemsCount.count });
  });
}
