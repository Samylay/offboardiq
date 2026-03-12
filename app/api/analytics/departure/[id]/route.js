import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const departure = await db('departures').where({ id, org_id: user.orgId }).first();
    if (!departure) return NextResponse.json({ error: 'Departure not found' }, { status: 404 });

    const [domains, items, interviews, tasks, riskHistory] = await Promise.all([
      db('knowledge_domains').where({ departure_id: id }),
      db('knowledge_items').where({ departure_id: id }),
      db('interviews').where({ departure_id: id }),
      db('transfer_tasks').join('transfer_plans', 'transfer_tasks.plan_id', 'transfer_plans.id').where('transfer_plans.departure_id', id),
      db('risk_assessments').where({ departure_id: id }).orderBy('created_at', 'desc'),
    ]);

    return NextResponse.json({
      departure,
      knowledge: {
        totalDomains: domains.length, capturedDomains: domains.filter((d) => d.capture_completeness >= 70).length,
        totalItems: items.length, verifiedItems: items.filter((i) => i.is_verified).length,
        byType: items.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {}),
      },
      interviews: {
        total: interviews.length, completed: interviews.filter((i) => i.status === 'completed').length,
        totalMessages: interviews.reduce((s, i) => s + (JSON.parse(i.messages || '[]')).length, 0),
      },
      transfer: {
        totalTasks: tasks.length, completedTasks: tasks.filter((t) => t.status === 'completed').length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0,
      },
      riskHistory,
    });
  });
}
