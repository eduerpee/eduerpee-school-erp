const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edumanage',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => logger.debug('Database connection established'));
pool.on('error', (err) => logger.error('Unexpected DB error:', err));

// ── Core query helper ─────────────────────────────────────
const db = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug(`Query executed in ${duration}ms: ${text.slice(0, 80)}`);
      return result;
    } catch (err) {
      logger.error(`DB Query error: ${err.message}\nQuery: ${text}`);
      throw err;
    }
  },

  // Return single row
  queryOne: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows[0] || null;
  },

  // Return all rows
  queryAll: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows;
  },

  // Transaction helper
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Paginated query helper
  paginate: async (text, params, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const countQuery = `SELECT COUNT(*) FROM (${text}) AS t`;
    const dataQuery = `${text} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params),
      db.query(dataQuery, [...params, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].count);
    return {
      data: dataResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
};

module.exports = db;
