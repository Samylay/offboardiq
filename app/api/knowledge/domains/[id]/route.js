import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['name', 'category', 'criticality', 'description', 'successor_id', 'replaceability', 'status', 'capture_completeness'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const [domain] = await db('knowledge_domains').where({ id }).update({ ...updates, updated_at: new Date() }).returning('*');
    if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    return NextResponse.json(domain);
  });
}

export async function DELETE(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const deleted = await db('knowledge_domains').where({ id }).del();
    if (!deleted) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  });
}
