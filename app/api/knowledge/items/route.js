import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const departureId = searchParams.get('departureId');
    const domainId = searchParams.get('domainId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    let query = db('knowledge_items')
      .join('departures', 'knowledge_items.departure_id', 'departures.id')
      .where({ 'departures.org_id': user.orgId })
      .select('knowledge_items.*');

    if (departureId) query = query.where({ 'knowledge_items.departure_id': departureId });
    if (domainId) query = query.where({ 'knowledge_items.domain_id': domainId });

    const items = await query.orderBy('knowledge_items.created_at', 'desc').limit(limit).offset((page - 1) * limit);
    return NextResponse.json(items);
  });
}
