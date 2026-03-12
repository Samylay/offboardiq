import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateTokens } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await db('users').where({ email, is_active: true }).first();
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tokens = generateTokens(user.id, user.org_id);

    const org = await db('organizations').where({ id: user.org_id }).first();

    return NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      organization: { id: org.id, name: org.name, slug: org.slug },
      ...tokens,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
