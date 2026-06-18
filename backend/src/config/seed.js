const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding demo data...');

    // School
    const school = await client.query(`
      INSERT INTO schools (name, code, city, state, phone, email, principal_name, established_year)
      VALUES ('Sunrise High School', 'SHS001', 'Lucknow', 'Uttar Pradesh', '0522-1234567',
              'info@sunrisehigh.edu.in', 'Rajesh Kumar', 1995)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`);
    const schoolId = school.rows[0].id;

    // Academic year
    const ay = await client.query(`
      INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
      VALUES ($1, '2025-26', '2025-04-01', '2026-03-31', TRUE)
      ON CONFLICT DO NOTHING RETURNING id`,
      [schoolId]);
    const ayId = ay.rows[0]?.id;

    const hash = await bcrypt.hash('admin123', 12);

    // Users
    const users = [
      { username: 'admin',      email: 'admin@sunrise.edu.in',      role: 'school_admin', name: 'Admin User' },
      { username: 'principal',  email: 'principal@sunrise.edu.in',  role: 'principal',    name: 'Rajesh Kumar' },
      { username: 'teacher1',   email: 'teacher1@sunrise.edu.in',   role: 'teacher',      name: 'Sunita Sharma' },
      { username: 'accountant', email: 'accounts@sunrise.edu.in',   role: 'accountant',   name: 'Kavita Mishra' },
      { username: 'receptionist', email: 'reception@sunrise.edu.in',role: 'receptionist', name: 'Anjali Singh' },
      { username: 'parent1',    email: 'parent1@gmail.com',         role: 'parent',       name: 'Rajesh Sharma' },
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (school_id, username, email, password_hash, role, full_name, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,TRUE)
        ON CONFLICT (username) DO NOTHING`,
        [schoolId, u.username, u.email, hash, u.role, u.name]);
    }

    // Classes
    const classNames = ['Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
    for (let i = 0; i < classNames.length; i++) {
      await client.query(`
        INSERT INTO classes (school_id, academic_year_id, name, numeric_level, is_active)
        VALUES ($1,$2,$3,$4,TRUE) ON CONFLICT DO NOTHING`,
        [schoolId, ayId, classNames[i], i + 6]);
    }

    // Fee types
    const feeTypes = ['Tuition Fee','Admission Fee','Exam Fee','Transport Fee','Annual Fee','Library Fee'];
    for (const ft of feeTypes) {
      await client.query(`
        INSERT INTO fee_types (school_id, name, is_recurring, frequency)
        VALUES ($1,$2,TRUE,'monthly') ON CONFLICT DO NOTHING`,
        [schoolId, ft]);
    }

    // Expense categories
    const expCats = ['Salary','Maintenance','Utilities','Stationery','Events','Miscellaneous'];
    for (const ec of expCats) {
      await client.query(`INSERT INTO expense_categories (school_id, name) VALUES ($1,$2) ON CONFLICT DO NOTHING`,[schoolId, ec]);
    }

    await client.query('COMMIT');
    console.log('✅ Demo data seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  admin / admin123        → School Admin');
    console.log('  principal / admin123    → Principal');
    console.log('  teacher1 / admin123     → Teacher');
    console.log('  accountant / admin123   → Accountant');
    console.log('  receptionist / admin123 → Receptionist');
    console.log('  parent1 / admin123      → Parent');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
