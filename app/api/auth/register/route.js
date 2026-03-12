import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateTokens } from '@/lib/auth';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  orgName: Joi.string().required(),
  orgSlug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { error, value } = schema.validate(body);
    if (error) return NextResponse.json({ error: error.details[0].message }, { status: 400 });

    const existingUser = await db('users').where({ email: value.email }).first();
    if (existingUser) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const existingOrg = await db('organizations').where({ slug: value.orgSlug }).first();
    if (existingOrg) return NextResponse.json({ error: 'Organization slug already taken' }, { status: 409 });

    const passwordHash = await hashPassword(value.password);

    const result = await db.transaction(async (trx) => {
      const [org] = await trx('organizations').insert({
        name: value.orgName, slug: value.orgSlug,
        settings: JSON.stringify({ interviewDefaultDuration: 60, riskThresholds: { low: 30, medium: 60, high: 80 } }),
      }).returning('*');

      const [user] = await trx('users').insert({
        org_id: org.id, email: value.email, password_hash: passwordHash,
        first_name: value.firstName, last_name: value.lastName, role: 'admin',
      }).returning('*');

      return { org, user };
    });

    const tokens = generateTokens(result.user.id, result.org.id);

    return NextResponse.json({
      user: { id: result.user.id, email: result.user.email, firstName: result.user.first_name, lastName: result.user.last_name, role: result.user.role },
      organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
      ...tokens,
    }, { status: 201 });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
