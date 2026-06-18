-- ============================================================
-- EduManage School Management System - PostgreSQL Schema
-- Version 1.0 | Production Ready
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('super_admin','school_admin','principal','teacher','accountant','receptionist','parent','student');
CREATE TYPE gender_type AS ENUM ('male','female','other');
CREATE TYPE blood_group AS ENUM ('A+','A-','B+','B-','O+','O-','AB+','AB-');
CREATE TYPE category_type AS ENUM ('general','obc','sc','st','ews');
CREATE TYPE attendance_status AS ENUM ('present','absent','leave','late','holiday');
CREATE TYPE fee_payment_mode AS ENUM ('cash','upi','bank_transfer','cheque','online');
CREATE TYPE fee_status AS ENUM ('paid','partial','pending','waived');
CREATE TYPE enquiry_status AS ENUM ('new','follow_up','interested','not_interested','converted');
CREATE TYPE employee_type AS ENUM ('teacher','accountant','receptionist','driver','peon','principal','admin','librarian','security');
CREATE TYPE exam_type AS ENUM ('unit_test','half_yearly','annual','quarterly','practical');
CREATE TYPE notice_type AS ENUM ('general','circular','event','holiday','urgent');
CREATE TYPE leave_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE transport_type AS ENUM ('school_bus','van','auto');
CREATE TYPE book_status AS ENUM ('available','issued','reserved','damaged','lost');

-- ============================================================
-- MODULE 0: MULTI-SCHOOL MANAGEMENT
-- ============================================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    logo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    principal_name VARCHAR(100),
    affiliation_no VARCHAR(50),
    established_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expiry DATE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 1: USERS & AUTH
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(150),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expiry TIMESTAMPTZ,
    refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, read, update, delete
    UNIQUE(role, module, action)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 2: SCHOOL SETUP
-- ============================================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(50) NOT NULL,
    numeric_level INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name, academic_year_id)
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(10) NOT NULL,
    capacity INTEGER DEFAULT 40,
    class_teacher_id UUID REFERENCES users(id),
    room_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, name)
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    type VARCHAR(20) DEFAULT 'theory', -- theory, practical, both
    max_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 33,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, code)
);

CREATE TABLE class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id),
    periods_per_week INTEGER DEFAULT 5,
    UNIQUE(class_id, subject_id)
);

-- ============================================================
-- MODULE 3: STUDENT MANAGEMENT
-- ============================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    admission_no VARCHAR(30) UNIQUE NOT NULL,
    roll_no VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender gender_type,
    blood_group blood_group,
    category category_type DEFAULT 'general',
    religion VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'Indian',
    aadhaar_no VARCHAR(20) UNIQUE,
    photo_url TEXT,
    current_class_id UUID REFERENCES classes(id),
    current_section_id UUID REFERENCES sections(id),
    admission_date DATE,
    academic_year_id UUID REFERENCES academic_years(id),
    previous_school VARCHAR(200),
    previous_class VARCHAR(50),
    previous_marks_percent DECIMAL(5,2),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_transport_enrolled BOOLEAN DEFAULT FALSE,
    is_hostel_enrolled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'active', -- active, inactive, transferred, passed_out
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relation VARCHAR(30) NOT NULL, -- father, mother, guardian
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    alternate_phone VARCHAR(15),
    email VARCHAR(100),
    occupation VARCHAR(100),
    annual_income DECIMAL(12,2),
    aadhaar_no VARCHAR(20),
    address TEXT,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES users(id) -- if parent has login
);

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50), -- birth_certificate, aadhaar, marksheet, tc, photo
    file_url TEXT NOT NULL,
    file_name VARCHAR(200),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 4: ENQUIRY & ADMISSION
-- ============================================================
CREATE TABLE enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    enquiry_no VARCHAR(30) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alternate_mobile VARCHAR(15),
    email VARCHAR(100),
    class_interested VARCHAR(50),
    address TEXT,
    source VARCHAR(50), -- walk_in, phone, website, reference, social_media
    follow_up_date DATE,
    remarks TEXT,
    status enquiry_status DEFAULT 'new',
    assigned_to UUID REFERENCES users(id),
    converted_to_student_id UUID REFERENCES students(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enquiry_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
    notes TEXT,
    next_follow_up_date DATE,
    status enquiry_status,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    registration_no VARCHAR(30) UNIQUE NOT NULL,
    enquiry_id UUID REFERENCES enquiries(id),
    student_name VARCHAR(150) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    desired_class VARCHAR(50),
    previous_school VARCHAR(200),
    registration_fee DECIMAL(10,2) DEFAULT 0,
    fee_paid BOOLEAN DEFAULT FALSE,
    receipt_no VARCHAR(30),
    status VARCHAR(30) DEFAULT 'pending', -- pending, converted, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 5: ATTENDANCE
-- ============================================================
CREATE TABLE student_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID REFERENCES academic_years(id),
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE TABLE employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in TIME,
    check_out TIME,
    remarks TEXT,
    marked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ============================================================
-- MODULE 6: FEE MANAGEMENT
-- ============================================================
CREATE TABLE fee_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30),
    description TEXT,
    is_recurring BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly, one_time
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    fee_type_id UUID REFERENCES fee_types(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    due_date INTEGER DEFAULT 10, -- day of month
    late_fee_per_day DECIMAL(8,2) DEFAULT 0,
    UNIQUE(academic_year_id, class_id, fee_type_id)
);

CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    fee_type_id UUID REFERENCES fee_types(id),
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    fine DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - discount + fine) STORED,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status fee_status DEFAULT 'pending',
    due_date DATE,
    month_year VARCHAR(10) -- e.g. '2025-06'
);

CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    student_fee_id UUID REFERENCES student_fees(id),
    receipt_no VARCHAR(30) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_mode fee_payment_mode NOT NULL,
    transaction_id VARCHAR(100),
    cheque_no VARCHAR(50),
    bank_name VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    collected_by UUID REFERENCES users(id),
    remarks TEXT,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    student_id UUID REFERENCES students(id),
    name VARCHAR(100),
    discount_type VARCHAR(20) DEFAULT 'amount', -- amount, percentage
    discount_value DECIMAL(10,2),
    applicable_fee_types UUID[], -- array of fee_type ids
    valid_from DATE,
    valid_to DATE,
    approved_by UUID REFERENCES users(id)
);

-- ============================================================
-- MODULE 7: EMPLOYEE MANAGEMENT
-- ============================================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    employee_id VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender gender_type,
    blood_group blood_group,
    photo_url TEXT,
    employee_type employee_type NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    qualification VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    joining_date DATE,
    leaving_date DATE,
    phone VARCHAR(15),
    alternate_phone VARCHAR(15),
    email VARCHAR(100),
    aadhaar_no VARCHAR(20),
    pan_no VARCHAR(20),
    bank_account_no VARCHAR(30),
    bank_name VARCHAR(100),
    ifsc_code VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 8: PAYROLL
-- ============================================================
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    employee_id UUID REFERENCES employees(id),
    basic_salary DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0,
    da DECIMAL(10,2) DEFAULT 0,
    ta DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    pf_employee DECIMAL(10,2) DEFAULT 0,
    pf_employer DECIMAL(10,2) DEFAULT 0,
    esi DECIMAL(10,2) DEFAULT 0,
    tds DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    effective_from DATE NOT NULL
);

CREATE TABLE payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    employee_id UUID REFERENCES employees(id),
    month_year VARCHAR(10) NOT NULL, -- '2025-06'
    working_days INTEGER,
    present_days INTEGER,
    leaves_taken INTEGER DEFAULT 0,
    gross_salary DECIMAL(10,2),
    total_deductions DECIMAL(10,2),
    net_salary DECIMAL(10,2),
    payment_date DATE,
    payment_mode VARCHAR(30),
    payment_status VARCHAR(20) DEFAULT 'pending',
    remarks TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month_year)
);

-- ============================================================
-- MODULE 9: EXAMINATIONS & RESULTS
-- ============================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(100) NOT NULL,
    exam_type exam_type NOT NULL,
    start_date DATE,
    end_date DATE,
    class_ids UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    max_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 33,
    room_no VARCHAR(20)
);

CREATE TABLE student_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    exam_schedule_id UUID REFERENCES exam_schedules(id),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    marks_obtained DECIMAL(6,2),
    is_absent BOOLEAN DEFAULT FALSE,
    grade VARCHAR(5),
    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_schedule_id, student_id)
);

-- ============================================================
-- MODULE 10: TIMETABLE
-- ============================================================
CREATE TABLE timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES users(id),
    day_of_week INTEGER NOT NULL, -- 1=Monday...6=Saturday
    period_no INTEGER NOT NULL,
    start_time TIME,
    end_time TIME,
    room_no VARCHAR(20),
    UNIQUE(class_id, section_id, day_of_week, period_no),
    UNIQUE(teacher_id, day_of_week, period_no) -- conflict check
);

-- ============================================================
-- MODULE 11: HOMEWORK
-- ============================================================
CREATE TABLE homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    attachment_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 12: TRANSPORT
-- ============================================================
CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    route_name VARCHAR(100) NOT NULL,
    route_no VARCHAR(20),
    start_point VARCHAR(200),
    end_point VARCHAR(200),
    distance_km DECIMAL(6,2),
    monthly_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    registration_no VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type transport_type DEFAULT 'school_bus',
    make_model VARCHAR(100),
    capacity INTEGER,
    route_id UUID REFERENCES transport_routes(id),
    driver_id UUID REFERENCES employees(id),
    fitness_expiry DATE,
    insurance_expiry DATE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE transport_pickup_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    point_name VARCHAR(200) NOT NULL,
    pickup_time TIME,
    drop_time TIME,
    sequence_no INTEGER
);

CREATE TABLE student_transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID REFERENCES transport_routes(id),
    pickup_point_id UUID REFERENCES transport_pickup_points(id),
    academic_year_id UUID REFERENCES academic_years(id),
    UNIQUE(student_id, academic_year_id)
);

-- ============================================================
-- MODULE 13: LIBRARY
-- ============================================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    isbn VARCHAR(30),
    title VARCHAR(300) NOT NULL,
    author VARCHAR(200),
    publisher VARCHAR(200),
    edition VARCHAR(50),
    category VARCHAR(100),
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    rack_no VARCHAR(20),
    status book_status DEFAULT 'available',
    added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id),
    issued_to UUID REFERENCES users(id), -- student or employee user_id
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_per_day DECIMAL(6,2) DEFAULT 2,
    fine_amount DECIMAL(8,2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT FALSE,
    issued_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'issued' -- issued, returned, overdue
);

-- ============================================================
-- MODULE 14: NOTICE BOARD
-- ============================================================
CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    notice_type notice_type DEFAULT 'general',
    target_roles user_role[], -- null = all
    target_classes UUID[],
    attachment_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 15: EXPENSES
-- ============================================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    category_id UUID REFERENCES expense_categories(id),
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    payment_mode fee_payment_mode,
    vendor_name VARCHAR(200),
    invoice_no VARCHAR(100),
    attachment_url TEXT,
    remarks TEXT,
    approved_by UUID REFERENCES users(id),
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 16: LEAVE MANAGEMENT
-- ============================================================
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,
    days_allowed INTEGER,
    applies_to VARCHAR(20) DEFAULT 'all' -- teacher, staff, all
);

CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    employee_id UUID REFERENCES employees(id),
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MODULE 17: INVENTORY
-- ============================================================
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    category_id UUID REFERENCES inventory_categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit VARCHAR(30),
    total_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 5,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    location VARCHAR(100)
);

-- ============================================================
-- MODULE 18: FESTIVALS & HOLIDAYS
-- ============================================================
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(200) NOT NULL,
    holiday_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'national', -- national, school, local, festival
    description TEXT
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(current_class_id, current_section_id);
CREATE INDEX idx_students_admission_no ON students(admission_no);
CREATE INDEX idx_student_attendance_date ON student_attendance(date, school_id);
CREATE INDEX idx_student_attendance_student ON student_attendance(student_id, date);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX idx_employees_school ON employees(school_id);
CREATE INDEX idx_exam_marks_student ON student_marks(student_id, exam_id);
CREATE INDEX idx_notices_school ON notices(school_id, is_published);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_users_school ON users(school_id, role);
CREATE INDEX idx_enquiries_status ON enquiries(school_id, status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT PERMISSIONS SEED
-- ============================================================
INSERT INTO role_permissions (role, module, action) VALUES
('school_admin','*','*'),
('principal','students','read'),('principal','students','update'),
('principal','attendance','read'),('principal','exams','read'),
('principal','employees','read'),('principal','notices','create'),
('teacher','attendance','create'),('teacher','attendance','update'),
('teacher','marks','create'),('teacher','marks','update'),
('teacher','homework','create'),('teacher','homework','update'),
('accountant','fees','*'),('accountant','expenses','*'),('accountant','payroll','*'),
('receptionist','enquiry','*'),('receptionist','registration','*'),
('receptionist','students','create'),('receptionist','students','read'),
('parent','students','read'),('parent','attendance','read'),
('parent','fees','read'),('parent','results','read'),
('student','profile','read'),('student','attendance','read'),
('student','results','read'),('student','homework','read');
