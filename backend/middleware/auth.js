import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[auth] JWT_SECRET is not set. Using an insecure development fallback.');
    return 'machanix-development-secret-change-me';
  }
  return secret;
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.auth;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, getJwtSecret());
  } catch {
    req.user = null;
  }
  return next();
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    return next();
  });
}

export function requireRole(role) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden.' });
      return next();
    });
  };
}
