import { NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });

    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });

    const user = await db('users').where({ id: payload.userId, is_active: true }).first();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const tokens = generateTokens(user.id, user.org_id);
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
