-- ============================================================
-- EduManage — DATABASE SETUP GUIDE
-- ============================================================
--
-- STEP 1: Create the database
-- STEP 2: Run schema (01_schema.sql)
-- STEP 3: Run seed data (02_seed_data.sql)
-- STEP 4: Verify setup
--
-- ============================================================


-- ============================================================
-- STEP 1: Create database (run as postgres superuser)
-- ============================================================

-- Windows (pgAdmin or CMD):
--   Open pgAdmin → right-click Databases → Create → Database
--   Name: edumanage, Owner: postgres

-- Linux / Mac terminal:
--   sudo -u postgres psql
--   CREATE DATABASE edumanage;
--   \q

-- Or one-liner:
--   createdb -U postgres edumanage


-- ============================================================
-- STEP 2: Run schema
-- ============================================================

-- Linux / Mac:
--   psql -U postgres -d edumanage -f database/01_schema.sql

-- Windows CMD:
--   psql -U postgres -d edumanage -f database\01_schema.sql

-- pgAdmin:
--   Open Query Tool → File → Open → select 01_schema.sql → Run (F5)


-- ============================================================
-- STEP 3: Run seed data
-- ============================================================

-- Linux / Mac:
--   psql -U postgres -d edumanage -f database/02_seed_data.sql

-- Windows CMD:
--   psql -U postgres -d edumanage -f database\02_seed_data.sql

-- pgAdmin:
--   Open Query Tool → File → Open → select 02_seed_data.sql → Run (F5)


-- ============================================================
-- STEP 4: Verify (run these queries to confirm everything worked)
-- ============================================================

-- Count tables:
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 45+

-- Check schools:
SELECT id, name, code, city FROM schools;

-- Check users & passwords:
SELECT username, role, full_name FROM users ORDER BY role;
-- All passwords are: admin123

-- Check students:
SELECT admission_no, first_name, last_name, status FROM students ORDER BY admission_no;

-- Check fee structures:
SELECT c.name AS class, ft.name AS fee_type, fs.amount
FROM fee_structures fs
JOIN classes c ON fs.class_id = c.id
JOIN fee_types ft ON fs.fee_type_id = ft.id
ORDER BY c.numeric_level, ft.name;

-- Check attendance:
SELECT s.first_name, sa.date, sa.status
FROM student_attendance sa
JOIN students s ON sa.student_id = s.id
ORDER BY sa.date, s.first_name;

-- Check notices:
SELECT title, notice_type, publish_date FROM notices ORDER BY publish_date DESC;


-- ============================================================
-- OPTIONAL: Reset / Drop all tables (DANGER — deletes everything)
-- ============================================================

-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;
-- Then re-run 01_schema.sql and 02_seed_data.sql


-- ============================================================
-- BACKUP & RESTORE
-- ============================================================

-- Backup:
--   pg_dump -U postgres -d edumanage -f edumanage_backup.sql

-- Restore:
--   psql -U postgres -d edumanage -f edumanage_backup.sql

-- Docker backup:
--   docker exec edumanage_db pg_dump -U postgres edumanage > backup.sql

-- Docker restore:
--   docker exec -i edumanage_db psql -U postgres edumanage < backup.sql
