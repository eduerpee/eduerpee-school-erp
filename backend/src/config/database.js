const dns  = require('dns');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');

dns.setDefaultResultOrder('ipv4first');

const poolConfig = process.env.DATABASE_URL
  ? {
      host:     'db.fttmxszfkvynhprcfzyr.supabase.co',
      port:     5432,
      database: 'postgres',
      user:     'postgres',
      password: process.env.DB_PASSWORD,
      ssl:      { require: true, rejectUnauthorized: false },
      family:   4,
      // ── Performance settings ──
      max:                  10,   // max connections in pool
      min:                  2,    // keep 2 connections alive always
      idleTimeoutMillis:    30000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle:      false,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'edumanage',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl:      process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
      family:   4,
      max:                  10,
      min:                  2,
      idleTimeoutMillis:    30000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle:      false,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => logger.error('Unexpected DB error:', err));

// ── Simple cache for frequent static queries ──────────────────────
const cache     = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function cacheClear(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ── DB helper methods ─────────────────────────────────────────────
const db = {
  query:    (text, params) => pool.query(text, params),
  queryOne: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows[0] || null;
  },
  queryAll: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows;
  },
  // Cached query — for static data like classes, sections, subjects
  queryCached: async (key, text, params) => {
    const cached = cacheGet(key);
    if (cached) return cached;
    const res = await pool.query(text, params);
    cacheSet(key, res.rows);
    return res.rows;
  },
  cacheGet, cacheSet, cacheClear,
  getPool: () => pool,
};

// ── Test connection on startup ────────────────────────────────────
async function testConnection() {
  try {
    const client = await pool.connect();
    const res    = await client.query('SELECT NOW() as time, current_database() as db');
    client.release();
    console.log('✅ Database connected successfully!');
    console.log(`   Database : ${res.rows[0].db}`);
    console.log(`   Time     : ${res.rows[0].time}`);
    console.log(`   Host     : ${process.env.DATABASE_URL ? 'Supabase/Cloud' : process.env.DB_HOST || 'localhost'}`);
    console.log(`   Pool     : min=${poolConfig.min}, max=${poolConfig.max}`);
  } catch (err) {
    console.error('❌ Database connection FAILED!');
    console.error('   Error:', err.message);
    if (!process.env.DATABASE_URL) {
      console.error('   DB_HOST    =', process.env.DB_HOST || 'localhost');
      console.error('   DB_NAME    =', process.env.DB_NAME || 'edumanage');
      console.error('   DB_USER    =', process.env.DB_USER || 'postgres');
      console.error('   DB_PASSWORD=', process.env.DB_PASSWORD ? '****' : '(empty)');
    }
    process.exit(1);
  }
}

testConnection();

module.exports = db;
