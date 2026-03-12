import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const departure = await db('departures')
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .leftJoin('users as hr_owner', 'departures.hr_owner_id', 'hr_owner.id')
      .where({ 'departures.id': id, 'departures.org_id': user.orgId })
      .select(
        'departures.*',
        db.raw("employee.first_name || ' ' || employee.last_name as employee_name"),
        'employee.title', 'employee.department', 'employee.email as employee_email',
        db.raw("hr_owner.first_name || ' ' || hr_owner.last_name as hr_owner_name")
      )
      .first();

    if (!departure) return NextResponse.json({ error: 'Departure not found' }, { status: 404 });

    const [domains, riskAssessment, interviews, transferPlans] = await Promise.all([
      db('knowledge_domains').where({ departure_id: id }),
      db('risk_assessments').where({ departure_id: id }).first(),
      db('interviews').where({ departure_id: id }).orderBy('created_at', 'desc'),
      db('transfer_plans').where({ departure_id: id }),
    ]);

    return NextResponse.json({ ...departure, domains, riskAssessment, interviews, transferPlans });
  });
}

export async function PATCH(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const body = await req.json();

    const departure = await db('departures').where({ id, org_id: user.orgId }).first();
    if (!departure) return NextResponse.json({ error: 'Departure not found' }, { status: 404 });

    const allowedFields = ['status', 'last_working_day', 'departure_notes', 'hr_owner_id'];
    const updates = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const [updated] = await db('departures').where({ id }).update({ ...updates, updated_at: new Date() }).returning('*');
    return NextResponse.json(updated);
  });
}
