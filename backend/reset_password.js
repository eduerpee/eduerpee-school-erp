// reset_password.js
// Run this file in your backend folder:
// cd Downloads/edumanage/backend
// node reset_password.js

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edumanage',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function resetPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔐 Generating password hash for admin123...');
    const hash = await bcrypt.hash('admin123', 10);
    console.log('✅ Hash generated:', hash);

    // First ensure school exists
    await client.query(`
      INSERT INTO schools (id, name, code, city, state, phone, email, principal_name, established_year, is_active)
      VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'Sunrise High School', 'SHS001', 'Lucknow',
        'Uttar Pradesh', '0522-1234567',
        'info@sunrisehigh.edu.in', 'Rajesh Kumar', 1995, TRUE
      ) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    `);

    // Ensure academic year exists
    await client.query(`
      INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
      VALUES (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '2025-26', '2025-04-01', '2026-03-31', TRUE
      ) ON CONFLICT DO NOTHING
    `);

    // Delete old users to avoid conflicts
    await client.query(`
      DELETE FROM users WHERE username IN ('admin','principal','teacher1','accountant','receptionist','parent1')
    `);

    // Insert all users with freshly generated hash
    const users = [
      { username: 'admin',        email: 'admin@sunrise.edu.in',        role: 'school_admin', name: 'Admin User' },
      { username: 'principal',    email: 'principal@sunrise.edu.in',    role: 'principal',    name: 'Rajesh Kumar' },
      { username: 'teacher1',     email: 'teacher1@sunrise.edu.in',     role: 'teacher',      name: 'Sunita Sharma' },
      { username: 'accountant',   email: 'accounts@sunrise.edu.in',     role: 'accountant',   name: 'Kavita Mishra' },
      { username: 'receptionist', email: 'reception@sunrise.edu.in',    role: 'receptionist', name: 'Anjali Singh' },
      { username: 'parent1',      email: 'parent1@gmail.com',           role: 'parent',       name: 'Parent User' },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (school_id, username, email, password_hash, role, full_name, is_active)
         VALUES ('a0000000-0000-0000-0000-000000000001', $1, $2, $3, $4, $5, TRUE)`,
        [u.username, u.email, hash, u.role, u.name]
      );
      console.log(`✅ Created user: ${u.username}`);
    }

    console.log('\n🎉 Done! All users reset successfully.');
    console.log('\n📋 Login Credentials (all use password: admin123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  admin        / admin123  → School Admin');
    console.log('  principal    / admin123  → Principal');
    console.log('  teacher1     / admin123  → Teacher');
    console.log('  accountant   / admin123  → Accountant');
    console.log('  receptionist / admin123  → Receptionist');
    console.log('  parent1      / admin123  → Parent');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nNow go to http://localhost:3000 and login!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPasswords();
