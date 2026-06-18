-- ============================================================
-- EduManage — Demo Students Seed
-- Run this after 01_schema.sql and 02_seed_data.sql
-- Adds 10 demo students with parents and fee records
-- ============================================================

-- Get school and academic year IDs
DO $$
DECLARE
  v_school_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_ay_id      UUID := 'b0000000-0000-0000-0000-000000000001';
  v_class6a    UUID;
  v_class7a    UUID;
  v_class8a    UUID;
  v_class8b    UUID;
  v_class9a    UUID;
  v_class10a   UUID;
  v_class10b   UUID;
  v_class11b   UUID;
  v_class12a   UUID;
  v_sec6a      UUID;
  v_sec7a      UUID;
  v_sec8a      UUID;
  v_sec8b      UUID;
  v_sec9a      UUID;
  v_sec10a     UUID;
  v_sec10b     UUID;
  v_sec11b     UUID;
  v_sec12a     UUID;
  v_fee_tui    UUID;
BEGIN
  -- Get class IDs
  SELECT id INTO v_class6a  FROM classes WHERE school_id=v_school_id AND name='Class 6'  LIMIT 1;
  SELECT id INTO v_class7a  FROM classes WHERE school_id=v_school_id AND name='Class 7'  LIMIT 1;
  SELECT id INTO v_class8a  FROM classes WHERE school_id=v_school_id AND name='Class 8'  LIMIT 1;
  SELECT id INTO v_class8b  FROM classes WHERE school_id=v_school_id AND name='Class 8'  LIMIT 1;
  SELECT id INTO v_class9a  FROM classes WHERE school_id=v_school_id AND name='Class 9'  LIMIT 1;
  SELECT id INTO v_class10a FROM classes WHERE school_id=v_school_id AND name='Class 10' LIMIT 1;
  SELECT id INTO v_class10b FROM classes WHERE school_id=v_school_id AND name='Class 10' LIMIT 1;
  SELECT id INTO v_class11b FROM classes WHERE school_id=v_school_id AND name='Class 11' LIMIT 1;
  SELECT id INTO v_class12a FROM classes WHERE school_id=v_school_id AND name='Class 12' LIMIT 1;

  -- Get section IDs
  SELECT id INTO v_sec6a  FROM sections WHERE class_id=v_class6a  AND name='A' LIMIT 1;
  SELECT id INTO v_sec7a  FROM sections WHERE class_id=v_class7a  AND name='A' LIMIT 1;
  SELECT id INTO v_sec8a  FROM sections WHERE class_id=v_class8a  AND name='A' LIMIT 1;
  SELECT id INTO v_sec8b  FROM sections WHERE class_id=v_class8b  AND name='B' LIMIT 1;
  SELECT id INTO v_sec9a  FROM sections WHERE class_id=v_class9a  AND name='A' LIMIT 1;
  SELECT id INTO v_sec10a FROM sections WHERE class_id=v_class10a AND name='A' LIMIT 1;
  SELECT id INTO v_sec10b FROM sections WHERE class_id=v_class10b AND name='B' LIMIT 1;
  SELECT id INTO v_sec11b FROM sections WHERE class_id=v_class11b AND name='A' LIMIT 1;
  SELECT id INTO v_sec12a FROM sections WHERE class_id=v_class12a AND name='A' LIMIT 1;

  -- Get tuition fee type
  SELECT id INTO v_fee_tui FROM fee_types WHERE school_id=v_school_id AND code='TUI' LIMIT 1;

  -- Insert students
  INSERT INTO students (school_id, admission_no, first_name, last_name, date_of_birth, gender, blood_group, category, current_class_id, current_section_id, academic_year_id, admission_date, city, state, is_active, status)
  VALUES
  (v_school_id,'ADM2501','Aarav',  'Sharma', '2009-03-14','male',  'B+', 'general', v_class10a,v_sec10a,v_ay_id,'2025-04-01','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2502','Priya',  'Singh',  '2011-07-22','female','A+', 'obc',     v_class8a, v_sec8b, v_ay_id,'2025-04-01','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2503','Rohit',  'Gupta',  '2007-11-05','male',  'O+', 'general', v_class12a,v_sec12a,v_ay_id,'2025-04-01','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2504','Ananya', 'Patel',  '2013-05-19','female','AB+','sc',      v_class6a, v_sec6a, v_ay_id,'2025-04-02','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2505','Dev',    'Kumar',  '2008-09-30','male',  'B-', 'general', v_class11b,v_sec11b,v_ay_id,'2025-04-02','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2506','Sakshi', 'Verma',  '2010-12-01','female','O-', 'general', v_class9a, v_sec9a, v_ay_id,'2025-04-03','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2507','Arjun',  'Mishra', '2012-02-17','male',  'A-', 'obc',     v_class7a, v_sec7a, v_ay_id,'2025-04-05','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2508','Neha',   'Tiwari', '2009-08-24','female','B+', 'general', v_class10a,v_sec10b,v_ay_id,'2025-04-06','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2509','Vikram', 'Joshi',  '2011-04-11','male',  'AB-','ews',     v_class8a, v_sec8a, v_ay_id,'2025-04-07','Lucknow','Uttar Pradesh',TRUE,'active'),
  (v_school_id,'ADM2510','Kavya',  'Rao',    '2013-01-28','female','O+', 'general', v_class6a, v_sec6a, v_ay_id,'2025-04-08','Lucknow','Uttar Pradesh',TRUE,'active')
  ON CONFLICT (admission_no) DO NOTHING;

  -- Insert parent contacts
  INSERT INTO student_parents (student_id, relation, full_name, phone, email, occupation, is_primary_contact)
  SELECT s.id, 'father', p.full_name, p.phone, p.email, p.occ, TRUE
  FROM students s
  JOIN (VALUES
    ('ADM2501','Rajesh Sharma',    '9876543210','rajesh@gmail.com',  'Business'),
    ('ADM2502','Manoj Singh',      '9765432100','manoj@gmail.com',   'Service'),
    ('ADM2503','Suresh Gupta',     '9988776655','suresh@gmail.com',  'Business'),
    ('ADM2504','Deepak Patel',     '9765432108','deepak@gmail.com',  'Govt Job'),
    ('ADM2505','Anil Kumar',       '9543218760','anil@gmail.com',    'Farmer'),
    ('ADM2506','Vivek Verma',      '9812345670','vivek@gmail.com',   'Doctor'),
    ('ADM2507','Sunil Mishra',     '9765001234','sunil@gmail.com',   'Teacher'),
    ('ADM2508','Ramesh Tiwari',    '9634567890','ramesh@gmail.com',  'Service'),
    ('ADM2509','Kailash Joshi',    '9876001234','kailash@gmail.com', 'Business'),
    ('ADM2510','Naresh Rao',       '9754321098','naresh@gmail.com',  'Advocate')
  ) AS p(adm, full_name, phone, email, occ) ON s.admission_no = p.adm
  WHERE s.school_id = v_school_id
  ON CONFLICT DO NOTHING;

  -- Insert fee records (tuition fee June 2025)
  IF v_fee_tui IS NOT NULL THEN
    INSERT INTO student_fees (school_id, student_id, academic_year_id, fee_type_id, amount, paid_amount, status, due_date, month_year)
    SELECT v_school_id, s.id, v_ay_id, v_fee_tui,
      CASE WHEN c.numeric_level >= 11 THEN 1800 WHEN c.numeric_level >= 9 THEN 1500 ELSE 1200 END,
      CASE s.admission_no
        WHEN 'ADM2501' THEN 1500 WHEN 'ADM2503' THEN 1800
        WHEN 'ADM2506' THEN 1500 WHEN 'ADM2507' THEN 1200
        WHEN 'ADM2510' THEN 1200 ELSE 0
      END,
      CASE s.admission_no
        WHEN 'ADM2501' THEN 'paid'::fee_status WHEN 'ADM2503' THEN 'paid'::fee_status
        WHEN 'ADM2504' THEN 'partial'::fee_status WHEN 'ADM2506' THEN 'paid'::fee_status
        WHEN 'ADM2507' THEN 'paid'::fee_status WHEN 'ADM2508' THEN 'partial'::fee_status
        WHEN 'ADM2510' THEN 'paid'::fee_status ELSE 'pending'::fee_status
      END,
      '2025-06-10', '2025-06'
    FROM students s
    JOIN classes c ON s.current_class_id = c.id
    WHERE s.school_id = v_school_id
      AND s.admission_no IN ('ADM2501','ADM2502','ADM2503','ADM2504','ADM2505','ADM2506','ADM2507','ADM2508','ADM2509','ADM2510')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Demo students inserted successfully!';
  RAISE NOTICE '   Run: SELECT admission_no, first_name, last_name FROM students ORDER BY admission_no;';
END $$;

-- Verify
SELECT s.admission_no, s.first_name, s.last_name,
       c.name AS class, sec.name AS section,
       sp.full_name AS parent, sp.phone
FROM students s
LEFT JOIN classes    c   ON s.current_class_id  = c.id
LEFT JOIN sections   sec ON s.current_section_id = sec.id
LEFT JOIN student_parents sp ON sp.student_id = s.id AND sp.is_primary_contact = TRUE
WHERE s.school_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY s.admission_no;
