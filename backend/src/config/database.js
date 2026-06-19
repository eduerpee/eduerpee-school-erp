const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Support both DATABASE_URL (Supabase/Neon/Railway) and individual env vars
const poolConfig = process.env.DATABASE_URL
  ? {
      host: 'db.fttmxszfkvynhprcfzyr.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { require: true, rejectUnauthorized: false },
      family: 4,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'edumanage',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true'
        ? { require: true, rejectUnauthorized: false }
        : false,
      family: 4,  // Force IPv4
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => logger.error('Unexpected DB error:', err));

// ── Test connection on startup ────────────────────────────
async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as time, current_database() as db');
    client.release();
    console.log('✅ Database connected successfully!');
    console.log(`   Database : ${res.rows[0].db}`);
    console.log(`   Time     : ${res.rows[0].time}`);
    console.log(`   Host     : ${process.env.DATABASE_URL ? 'Supabase/Cloud' : process.env.DB_HOST || 'localhost'}`);
  } catch (err) {
    console.error('❌ Database connection FAILED!');
    console.error('   Error   :', err.message);
    console.error('');
    console.error('   Check your .env file:');
    if (process.env.DATABASE_URL) {
      console.error('   DATABASE_URL =', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));
    } else {
      console.error('   DB_HOST     =', process.env.DB_HOST || 'localhost');
      console.error('   DB_PORT     =', process.env.DB_PORT || 5432);
      console.error('   DB_NAME     =', process.env.DB_NAME || 'edumanage');
      console.error('   DB_USER     =', process.env.DB_USER || 'postgres');
      console.error('   DB_PASSWORD =', process.env.DB_PASSWORD ? '****' : '(empty)');
      console.error('   DB_SSL      =', process.env.DB_SSL || 'false');
    }
    process.exit(1); // Stop server if DB not connected
  }
}

testConnection();

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
