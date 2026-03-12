import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import Joi from 'joi';

const createSchema = Joi.object({
  departureId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  category: Joi.string().valid('technical', 'process', 'relationship', 'institutional', 'tribal').required(),
  criticality: Joi.number().min(1).max(10).required(),
  description: Joi.string().allow('').optional(),
  successorId: Joi.string().uuid().allow(null).optional(),
  replaceability: Joi.number().min(1).max(10).optional(),
});

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const departureId = searchParams.get('departureId');

    let query = db('knowledge_domains')
      .join('departures', 'knowledge_domains.departure_id', 'departures.id')
      .where({ 'departures.org_id': user.orgId })
      .select('knowledge_domains.*');

    if (departureId) query = query.where({ 'knowledge_domains.departure_id': departureId });

    const domains = await query.orderBy('knowledge_domains.criticality', 'desc');
    return NextResponse.json(domains);
  });
}

export async function POST(request) {
  return withAuth(request, async (req, user) => {
    const body = await req.json();
    const { error, value } = createSchema.validate(body);
    if (error) return NextResponse.json({ error: error.details[0].message }, { status: 400 });

    const [domain] = await db('knowledge_domains').insert({
      departure_id: value.departureId, name: value.name, category: value.category,
      criticality: value.criticality, description: value.description,
      successor_id: value.successorId, replaceability: value.replaceability || 5,
      status: 'identified', capture_completeness: 0,
    }).returning('*');

    return NextResponse.json(domain, { status: 201 });
  });
}
