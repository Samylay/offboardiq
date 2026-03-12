import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { chat } from '@/lib/services/aiProvider';
import { extractKnowledgeItems } from '@/lib/services/knowledgeExtractor';

export async function POST(request, { params }) {
  return withAuth(request, async (req, user) => {
    const { id } = await params;
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const interview = await db('interviews')
      .join('departures', 'interviews.departure_id', 'departures.id')
      .where({ 'interviews.id': id, 'departures.org_id': user.orgId })
      .select('interviews.*')
      .first();

    if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    if (interview.status === 'completed') return NextResponse.json({ error: 'Interview is completed' }, { status: 400 });

    const messages = JSON.parse(interview.messages || '[]');
    messages.push({ role: 'user', content: message, timestamp: new Date() });

    const aiMessages = [
      { role: 'system', content: interview.system_prompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const aiResponse = await chat(aiMessages);

    // Extract any knowledge items from the AI response
    const knowledgeItems = extractKnowledgeItems(aiResponse);
    for (const item of knowledgeItems) {
      const domain = await db('knowledge_domains')
        .where({ departure_id: interview.departure_id })
        .orderBy('criticality', 'desc')
        .first();

      if (domain) {
        await db('knowledge_items').insert({
          departure_id: interview.departure_id, domain_id: domain.id, interview_id: id,
          title: item.title, type: item.type || 'document', category: item.category || 'technical',
          content: item.content, quality_score: item.criticality,
          source_type: 'interview', captured_by: user.id,
        });
      }
    }

    messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });
    await db('interviews').where({ id }).update({ messages: JSON.stringify(messages), updated_at: new Date() });

    return NextResponse.json({
      message: { role: 'assistant', content: aiResponse },
      extractedItems: knowledgeItems.length,
    });
  });
}
