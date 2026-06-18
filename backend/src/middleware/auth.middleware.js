const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AppError } = require('../utils/AppError');

// ── Verify Token ──────────────────────────────────────────
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await db.queryOne(
    `SELECT u.*, s.name as school_name, s.code as school_code 
     FROM users u 
     LEFT JOIN schools s ON u.school_id = s.id
     WHERE u.id = $1 AND u.is_active = TRUE`,
    [decoded.userId]
  );

  if (!user) throw new AppError('User not found or account deactivated.', 401);

  req.user = user;
  req.schoolId = user.school_id;
  next();
};

// ── Role-based Authorization ──────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403);
    }
    next();
  };
};

// ── Permission Check ──────────────────────────────────────
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    if (req.user.role === 'super_admin' || req.user.role === 'school_admin') {
      return next();
    }

    const permission = await db.queryOne(
      `SELECT 1 FROM role_permissions 
       WHERE (role = $1 AND module = $2 AND action = $3)
          OR (role = $1 AND module = '*'  AND action = '*')
          OR (role = $1 AND module = $2  AND action = '*')`,
      [req.user.role, module, action]
    );

    if (!permission) {
      throw new AppError(`You don't have permission to ${action} ${module}.`, 403);
    }
    next();
  };
};

// ── Audit Log Middleware ──────────────────────────────────
const auditLog = (module, action) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode < 400) {
        try {
          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action, module, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.schoolId, req.user?.id, action, module,
             req.ip, req.get('user-agent')]
          );
        } catch (e) { /* silent */ }
      }
    });
    next();
  };
};

module.exports = { authenticate, authorize, checkPermission, auditLog };
