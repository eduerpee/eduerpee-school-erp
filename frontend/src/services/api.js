import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const t = localStorage.getItem('accessToken');
    if (t) config.headers.Authorization = 'Bearer ' + t;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        try {
          const { data } = await axios.post(api.defaults.baseURL + '/auth/refresh', { refreshToken: rt });
          localStorage.setItem('accessToken',  data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          orig.headers.Authorization = 'Bearer ' + data.data.accessToken;
          return api(orig);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login:   (d) => api.post('/auth/login', d),
  me:      ()  => api.get('/auth/me'),
  logout:  ()  => api.post('/auth/logout'),
  refresh: (d) => api.post('/auth/refresh', d),
};

// ── Student ───────────────────────────────────────────────
export const studentAPI = {
  getAll:  (p) => api.get('/students',    { params: p }),
  getOne:  (id) => api.get('/students/' + id),
  create:  (d) => api.post('/students', d),
  update:  (id,d) => api.put('/students/' + id, d),
  delete:  (id) => api.delete('/students/' + id),
};

// ── Enquiry ───────────────────────────────────────────────
export const enquiryAPI = {
  getAll:  (p)    => api.get('/enquiries',      { params: p }),
  getOne:  (id)   => api.get('/enquiries/' + id),
  create:  (d)    => api.post('/enquiries', d),
  update:  (id,d) => api.put('/enquiries/' + id, d),
  delete:  (id)   => api.delete('/enquiries/' + id),
};

// ── Registration ──────────────────────────────────────────
export const registrationAPI = {
  getAll:  (p)   => api.get('/registrations',          { params: p }),
  create:  (d)   => api.post('/registrations', d),
  update:  (id,d)=> api.put('/registrations/' + id, d),
  convert: (id)  => api.post('/registrations/' + id + '/convert'),
};

// ── School (classes, sections) ────────────────────────────
export const schoolAPI = {
  getProfile:       ()    => api.get('/schools/profile'),
  updateProfile:    (d)   => api.put('/schools/profile', d),
  getClasses:       ()    => api.get('/schools/classes'),
  addClass:         (d)   => api.post('/schools/classes', d),      // NEW
  getSections:      (p)   => api.get('/schools/sections', { params: p }),
  getSubjects:      ()    => api.get('/schools/subjects'),
  addSubject:       (d)   => api.post('/schools/subjects', d),
  getAcademicYears: ()    => api.get('/schools/academic-years'),
};

// ── Fee ───────────────────────────────────────────────────
export const feeAPI = {
  getStructure:   (p) => api.get('/fees/structure',          { params: p }),
  getStudentFees: (id) => api.get('/fees/student/' + id),
  collect:        (d) => api.post('/fees/collect', d),
  getPending:     (p) => api.get('/fees/pending',            { params: p }),
  getCollection:  (p) => api.get('/fees/collection-report', { params: p }),
};

// ── Attendance ────────────────────────────────────────────
export const attendanceAPI = {
  mark:       (d) => api.post('/attendance/student/mark', d),
  getClass:   (p) => api.get('/attendance/student/class', { params: p }),
  getMonthly: (id,p) => api.get('/attendance/student/' + id + '/monthly', { params: p }),
  getReport:  (p) => api.get('/attendance/report', { params: p }),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ── Notice ────────────────────────────────────────────────
export const noticeAPI = {
  getAll:  (p)   => api.get('/notices',        { params: p }),
  create:  (d)   => api.post('/notices', d),
  update:  (id,d)=> api.put('/notices/' + id, d),
  delete:  (id)  => api.delete('/notices/' + id),
};

// ── Employee ──────────────────────────────────────────────
export const employeeAPI = {
  getAll:  (p)    => api.get('/employees',      { params: p }),
  getOne:  (id)   => api.get('/employees/' + id),
  create:  (d)    => api.post('/employees', d),
  update:  (id,d) => api.put('/employees/' + id, d),
};

// ── Report ────────────────────────────────────────────────
export const reportAPI = {
  getFeeSummary:        (p) => api.get('/reports/fee-summary',        { params: p }),
  getAttendanceSummary: (p) => api.get('/reports/attendance-summary', { params: p }),
  getStudentStrength:   (p) => api.get('/reports/student-strength',   { params: p }),
};

// ── Transport ─────────────────────────────────────────────
export const transportAPI = {
  getRoutes:   ()  => api.get('/transport/routes'),
  getVehicles: ()  => api.get('/transport/vehicles'),
};

// ── Library ───────────────────────────────────────────────
export const libraryAPI = {
  getBooks:   (p)  => api.get('/library/books', { params: p }),
  issueBook:  (d)  => api.post('/library/issue', d),
  returnBook: (id) => api.put('/library/return/' + id),
};

// ── Payroll ───────────────────────────────────────────────
export const payrollAPI = {
  getAll:  (p) => api.get('/payroll', { params: p }),
  process: (d) => api.post('/payroll', d),
};

export default api;
