import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { chat } from '@/lib/services/aiProvider';

export async function POST(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;

    const plan = await db('transfer_plans')
      .join('departures', 'transfer_plans.departure_id', 'departures.id')
      .where({ 'transfer_plans.id': id, 'departures.org_id': user.orgId })
      .select('transfer_plans.*', 'departures.last_working_day')
      .first();

    if (!plan) return NextResponse.json({ error: 'Transfer plan not found' }, { status: 404 });

    const domains = await db('knowledge_domains').where({ departure_id: plan.departure_id });
    const items = await db('knowledge_items').where({ departure_id: plan.departure_id });

    const prompt = `You are creating a knowledge transfer plan. Based on the following knowledge domains and items, generate a prioritized list of transfer tasks.

Knowledge Domains:
${domains.map((d) => `- ${d.name} (criticality: ${d.criticality}/10, category: ${d.category})`).join('\n')}

Knowledge Items Captured: ${items.length}
Last Working Day: ${plan.last_working_day}

Generate tasks in this JSON format:
[{"title": "...", "description": "...", "priority": 1-10, "estimated_hours": N, "category": "documentation|training|handoff|access_transfer"}]

Focus on the most critical items first. Be specific and actionable.`;

    const aiResponse = await chat([
      { role: 'system', content: 'You are an expert at creating knowledge transfer plans. Respond only with valid JSON.' },
      { role: 'user', content: prompt },
    ]);

    let tasks = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) tasks = JSON.parse(jsonMatch[0]);
    } catch {
      tasks = [
        { title: 'Document critical processes', description: 'Create written documentation for all critical processes', priority: 1, estimated_hours: 8, category: 'documentation' },
        { title: 'Schedule handoff meetings', description: 'Set up meetings with successors for each knowledge domain', priority: 2, estimated_hours: 4, category: 'handoff' },
        { title: 'Transfer access and credentials', description: 'Ensure all system access is transferred to successors', priority: 3, estimated_hours: 2, category: 'access_transfer' },
      ];
    }

    const insertedTasks = [];
    for (const task of tasks) {
      const [inserted] = await db('transfer_tasks').insert({
        plan_id: id, title: task.title, description: task.description,
        priority: task.priority, estimated_hours: task.estimated_hours,
        category: task.category, status: 'pending',
      }).returning('*');
      insertedTasks.push(inserted);
    }

    await db('transfer_plans').where({ id }).update({ status: 'active', updated_at: new Date() });

    return NextResponse.json({ plan: { ...plan, status: 'active' }, tasks: insertedTasks });
  });
}
