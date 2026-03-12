import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const org = await db('organizations').where({ id: user.orgId }).select('settings').first();
    const settings = typeof org.settings === 'string' ? JSON.parse(org.settings) : org.settings;
    return NextResponse.json(settings || {});
  });
}

export async function PATCH(request) {
  return withAuth(request, async (req, user) => {
    const updates = await req.json();
    const org = await db('organizations').where({ id: user.orgId }).first();
    const currentSettings = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {});
    const merged = { ...currentSettings, ...updates };

    await db('organizations').where({ id: user.orgId }).update({ settings: JSON.stringify(merged), updated_at: new Date() });
    return NextResponse.json(merged);
  }, { roles: ['admin', 'owner'] });
}
