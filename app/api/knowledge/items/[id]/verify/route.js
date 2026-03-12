import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const { verified, notes } = await req.json();

    const [item] = await db('knowledge_items').where({ id }).update({
      is_verified: verified !== false, verified_by: user.id, verified_at: new Date(),
      verification_notes: notes || null, updated_at: new Date(),
    }).returning('*');

    if (!item) return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    return NextResponse.json(item);
  });
}
