import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import Joi from 'joi';

const createSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  resignationDate: Joi.date().required(),
  lastWorkingDay: Joi.date().required(),
  departureReason: Joi.string().valid('voluntary', 'involuntary', 'retirement', 'contract_end', 'mutual').required(),
  departureNotes: Joi.string().allow('').optional(),
});

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    let query = db('departures')
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .leftJoin('users as hr_owner', 'departures.hr_owner_id', 'hr_owner.id')
      .where({ 'departures.org_id': user.orgId })
      .select(
        'departures.*',
        db.raw("employee.first_name || ' ' || employee.last_name as employee_name"),
        'employee.title', 'employee.department', 'employee.email as employee_email',
        db.raw("hr_owner.first_name || ' ' || hr_owner.last_name as hr_owner_name")
      );

    if (status) query = query.where({ 'departures.status': status });
    if (department) query = query.where({ 'employee.department': department });

    const [{ count }] = await db('departures').where({ org_id: user.orgId }).count();
    const departures = await query.orderBy('departures.last_working_day', 'asc').limit(limit).offset((page - 1) * limit);

    return NextResponse.json({ departures, pagination: { page, limit, total: +count, pages: Math.ceil(+count / limit) } });
  });
}

export async function POST(request) {
  return withAuth(request, async (req, user) => {
    const body = await req.json();
    const { error, value } = createSchema.validate(body);
    if (error) return NextResponse.json({ error: error.details[0].message }, { status: 400 });

    const employee = await db('users').where({ id: value.employeeId, org_id: user.orgId }).first();
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const [departure] = await db('departures').insert({
      org_id: user.orgId, employee_id: value.employeeId, hr_owner_id: user.id,
      status: 'initiated', resignation_date: value.resignationDate,
      last_working_day: value.lastWorkingDay, departure_reason: value.departureReason,
      departure_notes: value.departureNotes,
    }).returning('*');

    return NextResponse.json(departure, { status: 201 });
  });
}
