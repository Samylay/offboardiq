import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const departureId = searchParams.get('departureId');

    let query = db('transfer_plans')
      .join('departures', 'transfer_plans.departure_id', 'departures.id')
      .where({ 'departures.org_id': user.orgId })
      .select('transfer_plans.*');

    if (departureId) query = query.where({ 'transfer_plans.departure_id': departureId });

    const plans = await query.orderBy('transfer_plans.created_at', 'desc');

    for (const plan of plans) {
      plan.tasks = await db('transfer_tasks').where({ plan_id: plan.id }).orderBy('priority', 'asc');
    }

    return NextResponse.json(plans);
  });
}
