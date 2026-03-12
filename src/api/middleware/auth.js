const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { db } = require('../../config/database');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwt.secret);

    const user = await db('users')
      .where({ id: payload.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      orgId: user.org_id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function requireSameOrg(req, res, next) {
  const resourceOrgId = req.params.orgId || req.body.org_id;
  if (resourceOrgId && resourceOrgId !== req.user.orgId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

module.exports = { authenticate, requireRole, requireSameOrg };
