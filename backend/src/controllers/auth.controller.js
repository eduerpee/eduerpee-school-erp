const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const generateTokens = (userId, role, schoolId) => {
  const accessToken = jwt.sign(
    { userId, role, schoolId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new AppError('Username and password required', 400);

  const user = await db.queryOne(
    `SELECT u.*, s.name as school_name, s.is_active as school_active
     FROM users u
     LEFT JOIN schools s ON u.school_id = s.id
     WHERE (u.username = $1 OR u.email = $1)`,
    [username.toLowerCase().trim()]
  );

  if (!user) throw new AppError('Invalid credentials', 401);
  if (!user.is_active) throw new AppError('Account is deactivated. Contact admin.', 401);
  if (user.school_active === false) throw new AppError('School account is suspended.', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.school_id);

  // Store refresh token & update last login
  await db.query(
    'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2',
    [refreshToken, user.id]
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        schoolId: user.school_id,
        schoolName: user.school_name,
        avatarUrl: user.avatar_url,
      },
      accessToken,
      refreshToken,
    }
  });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await db.queryOne(
    'SELECT * FROM users WHERE id = $1 AND refresh_token = $2 AND is_active = TRUE',
    [decoded.userId, refreshToken]
  );

  if (!user) throw new AppError('Invalid refresh token', 401);

  const tokens = generateTokens(user.id, user.role, user.school_id);
  await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

  res.json({ success: true, data: tokens });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
const me = async (req, res) => {
  const user = await db.queryOne(
    `SELECT u.id, u.username, u.email, u.full_name, u.role, u.avatar_url,
            u.school_id, u.last_login, s.name as school_name, s.logo_url as school_logo
     FROM users u LEFT JOIN schools s ON u.school_id = s.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  res.json({ success: true, data: user });
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both passwords required', 400);
  if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);

  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

  res.json({ success: true, message: 'Password changed successfully' });
};

module.exports = { login, refresh, logout, me, changePassword };
