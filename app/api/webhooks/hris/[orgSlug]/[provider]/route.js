import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySignature, parseEvent, processEvent } from '@/lib/services/hrisWebhook';

export async function POST(request, { params }) {
  const { orgSlug, provider } = await params;

  const org = await db('organizations').where({ slug: orgSlug }).first();
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const body = await request.json();
  const rawBody = JSON.stringify(body);
  const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-hub-signature-256');

  const settings = typeof org.settings === 'string' ? JSON.parse(org.settings) : org.settings;
  const webhookSecret = settings?.webhookSecrets?.[provider];

  if (!verifySignature(provider, rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = parseEvent(provider, body);
  const departure = await processEvent(org.id, provider, event);

  return NextResponse.json({
    received: true,
    event: event.eventType,
    departureCreated: !!departure,
    departureId: departure?.id,
  });
}
