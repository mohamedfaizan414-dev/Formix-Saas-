const { verifyAccessToken } = require("../lib/auth/jwt");
const { roleHasPermission } = require("../lib/rbac/permissions");

const ACCESS_COOKIE_NAME = "formix_access";
const REFRESH_COOKIE_NAME = "formix_refresh";

function authenticate(req, res, next) {
  const token = req.cookies[ACCESS_COOKIE_NAME] || 
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") 
      ? req.headers.authorization.split(" ")[1] 
      : null);
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // sub, role, hospitalId, departmentId, email
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!roleList.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (!roleHasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: `Forbidden: requires permission "${permission}"` });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireAuth,
  requireRole,
  requirePermission,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
};
