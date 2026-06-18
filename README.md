# 🏫 EduManage — School Management System

A production-ready, full-stack School Management System built with **Node.js / Express**, **PostgreSQL**, and **React**.

---

## 📁 Project Structure

```
edumanage/
├── backend/                      # Node.js API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # PostgreSQL pool & query helpers
│   │   │   ├── schema.sql        # Full DB schema (18 modules, 45+ tables)
│   │   │   ├── migrate.js        # Run schema migration
│   │   │   └── seed.js           # Seed demo data & login accounts
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── fee.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── exam.controller.js
│   │   │   ├── notice.controller.js
│   │   │   ├── enquiry.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── school.controller.js
│   │   │   ├── transport.controller.js
│   │   │   ├── library.controller.js
│   │   │   ├── payroll.controller.js
│   │   │   └── timetable.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT + RBAC + Audit log
│   │   │   ├── error.middleware.js
│   │   │   └── notFound.middleware.js
│   │   ├── routes/                  # All API routes
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── generators.js        # Admission/Receipt/Employee ID
│   │   │   └── logger.js            # Winston logger
│   │   └── server.js
│   ├── .env                         # Environment variables
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                        # React Application
│   ├── public/
│   │   └── index.html               # Standalone working UI (no build needed)
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js               # Axios with auto token refresh
│   │   └── store/
│   │       ├── store.js             # Redux store
│   │       └── slices/              # Auth, UI, School slices
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml               # Full stack deployment
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone <repo>
cd edumanage
cp .env.example .env
# Edit .env with your secrets

docker-compose up -d
# App runs at http://localhost:3000
# API runs at http://localhost:5000
```

### Option 2 — Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 14+

#### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE edumanage;"

# Run schema migration
cd backend
npm install
node src/config/migrate.js

# Seed demo data
node src/config/seed.js
```

#### 2. Backend

```bash
cd backend
cp .env .env.local   # edit credentials
npm run dev          # starts on http://localhost:5000
```

#### 3. Frontend (standalone HTML — no build required)

```bash
# Just open in browser:
open frontend/public/index.html

# OR use the React app:
cd frontend
npm install
npm start            # starts on http://localhost:3000
```

---

## 🔐 Login Credentials (after seeding)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | School Admin |
| principal | admin123 | Principal |
| teacher1 | admin123 | Teacher |
| accountant | admin123 | Accountant |
| receptionist | admin123 | Receptionist |
| parent1 | admin123 | Parent |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user profile |
| PUT | /api/auth/change-password | Change password |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Full dashboard stats |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | List with filters, pagination |
| GET | /api/students/:id | Student + parents + fees + attendance |
| POST | /api/students | Create new admission |
| PUT | /api/students/:id | Update student |
| DELETE | /api/students/:id | Soft delete |
| POST | /api/students/:id/promote | Promote to next class |

### Fees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/fees/structure | Fee structure by class |
| GET | /api/fees/student/:id | Student's fee details |
| POST | /api/fees/collect | Collect fee payment |
| GET | /api/fees/collection-report | Collection report with filters |
| GET | /api/fees/pending | Pending dues list |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attendance/student/mark | Mark class attendance |
| GET | /api/attendance/student/class | Get class attendance for date |
| GET | /api/attendance/student/:id/monthly | Monthly attendance calendar |
| GET | /api/attendance/report | Attendance summary report |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List employees |
| GET | /api/employees/:id | Employee profile |
| POST | /api/employees | Add employee |
| PUT | /api/employees/:id | Update employee |

### School Setup
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/schools/profile | School info |
| PUT | /api/schools/profile | Update school |
| GET | /api/schools/classes | All classes |
| GET | /api/schools/sections | Sections (filter by classId) |
| GET | /api/schools/subjects | All subjects |
| GET | /api/schools/academic-years | Academic years |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/exams | List exams |
| POST | /api/exams | Create exam |
| POST | /api/exams/marks | Save marks (batch) |
| GET | /api/exams/results | Get results |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/fee-summary | Fee collection summary |
| GET | /api/reports/attendance-summary | Attendance summary |
| GET | /api/reports/student-strength | Class-wise strength |

### Other modules
- `/api/notices` — CRUD
- `/api/enquiries` — Enquiry management
- `/api/transport/routes` — Transport routes
- `/api/transport/vehicles` — Vehicles
- `/api/library/books` — Library catalog
- `/api/library/issue` — Issue/return books
- `/api/payroll` — Payroll processing
- `/api/timetable` — Timetable with conflict detection

---

## 🏗️ Database Modules (18)

1. Multi-school management
2. Users & Authentication (JWT + RBAC)
3. School setup (classes, sections, subjects)
4. Student management
5. Enquiry & Admissions
6. Attendance (student + employee)
7. Fee management (structure, collection, receipts)
8. Employee management
9. Payroll
10. Examinations & Results
11. Timetable
12. Homework
13. Transport
14. Library
15. Notice board
16. Expenses
17. Leave management
18. Inventory

---

## 🔧 Environment Variables

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://yourdomain.com

DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumanage
DB_USER=postgres
DB_PASSWORD=yourpassword

JWT_SECRET=32_char_minimum_secret
JWT_REFRESH_SECRET=32_char_minimum_secret
JWT_EXPIRES_IN=24h

# Optional SMS (MSG91)
MSG91_AUTH_KEY=
MSG91_SENDER_ID=SCHOOL

# Optional Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=school@gmail.com
SMTP_PASS=app_password
```

---

## 🔒 Security Features

- JWT access tokens (24h) + Refresh tokens (30d)
- Bcrypt password hashing (12 rounds)
- Role-based access control (8 roles)
- Rate limiting (200 req/15min global, 10 login attempts)
- Helmet.js security headers
- CORS protection
- Audit logging on all write operations
- Soft deletes (no permanent data loss)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | PostgreSQL 16 |
| ORM | Raw pg (optimized queries) |
| Auth | JWT + bcryptjs |
| Frontend | React 18 + Redux Toolkit |
| HTTP Client | Axios (with interceptors) |
| Validation | Joi |
| Logging | Winston |
| Container | Docker + docker-compose |
| Web Server | Nginx |

---

## 📈 Deployment (Production)

```bash
# 1. Clone and configure
git clone <repo>
cd edumanage
cp .env.example .env
nano .env  # Set secure passwords and secrets

# 2. Deploy with Docker
docker-compose -f docker-compose.yml up -d

# 3. Check logs
docker-compose logs -f backend

# 4. Access
# Frontend: http://your-server-ip:3000
# API:      http://your-server-ip:5000
```

For Nginx reverse proxy on port 80/443, point both `/` and `/api` to respective containers.

---

Built with ❤️ for Indian schools — EduManage v1.0
