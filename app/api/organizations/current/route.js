import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const org = await db('organizations').where({ id: user.orgId }).first();
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    return NextResponse.json(org);
  });
}
