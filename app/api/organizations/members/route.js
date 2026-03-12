import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const members = await db('users')
      .where({ org_id: user.orgId, is_active: true })
      .select('id', 'first_name', 'last_name', 'email', 'title', 'department', 'role', 'created_at')
      .orderBy('first_name');
    return NextResponse.json(members);
  });
}
