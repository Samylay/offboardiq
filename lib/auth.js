import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function generateTokens(userId, orgId) {
  const accessToken = jwt.sign({ userId, orgId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, orgId, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate a request and return the user context.
 * Returns null if authentication fails.
 */
export async function authenticateRequest(request) {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);

    const user = await db('users')
      .where({ id: payload.userId, is_active: true })
      .first();

    if (!user) return null;

    return {
      id: user.id,
      orgId: user.org_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  } catch {
    return null;
  }
}

/**
 * Wrapper for protected API routes.
 * Returns 401 if not authenticated, otherwise calls the handler with the user.
 */
export async function withAuth(request, handler, options = {}) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (options.roles && !options.roles.includes(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  return handler(request, user);
}
