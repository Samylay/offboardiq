import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['status', 'assignee_id', 'due_date', 'notes', 'completed_at'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (body.status === 'completed' && !updates.completed_at) updates.completed_at = new Date();

    const [task] = await db('transfer_tasks').where({ id }).update({ ...updates, updated_at: new Date() }).returning('*');
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  });
}
