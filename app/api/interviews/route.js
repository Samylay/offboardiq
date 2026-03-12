import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { buildInterviewPrompt, phases } from '@/lib/services/knowledgeExtractor';
import { chat } from '@/lib/services/aiProvider';

export async function POST(request) {
  return withAuth(request, async (req, user) => {
    const { departureId, phase } = await req.json();
    if (!departureId) return NextResponse.json({ error: 'departureId required' }, { status: 400 });

    const departure = await db('departures')
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .where({ 'departures.id': departureId, 'departures.org_id': user.orgId })
      .select('departures.*', db.raw("employee.first_name || ' ' || employee.last_name as employee_name"), 'employee.title', 'employee.department')
      .first();

    if (!departure) return NextResponse.json({ error: 'Departure not found' }, { status: 404 });

    const domains = await db('knowledge_domains').where({ departure_id: departureId });
    const currentPhase = phase || phases[0];
    const systemPrompt = buildInterviewPrompt(departure, domains, currentPhase);

    const openingMessage = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Begin the ${currentPhase.replace('_', ' ')} phase of the knowledge capture interview.` },
    ]);

    const [interview] = await db('interviews').insert({
      departure_id: departureId, interviewer_id: user.id, phase: currentPhase,
      status: 'in_progress', system_prompt: systemPrompt,
      messages: JSON.stringify([{ role: 'assistant', content: openingMessage, timestamp: new Date() }]),
      metadata: JSON.stringify({ phase: currentPhase, domains: domains.map((d) => d.name) }),
    }).returning('*');

    return NextResponse.json({ ...interview, messages: [{ role: 'assistant', content: openingMessage }] }, { status: 201 });
  });
}
