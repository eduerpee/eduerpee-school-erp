import { createSlice } from '@reduxjs/toolkit';

const INIT_ENQUIRIES = [
  { id:1, no:'ENQ001', name:'Riya Gupta',    parent:'Sanjay Gupta',   phone:'9811001100', class_:'Class 6',  source:'Walk-in',   date:'2025-06-05', status:'hot',    remarks:'Very interested, fee discussed' },
  { id:2, no:'ENQ002', name:'Rahul Sharma',  parent:'Amit Sharma',    phone:'9822002200', class_:'Class 9',  source:'Phone',     date:'2025-06-04', status:'warm',   remarks:'Wants demo class' },
  { id:3, no:'ENQ003', name:'Pooja Verma',   parent:'Dinesh Verma',   phone:'9833003300', class_:'Class 7',  source:'Reference', date:'2025-06-03', status:'hot',    remarks:'Referred by existing parent' },
  { id:4, no:'ENQ004', name:'Akash Yadav',   parent:'Suresh Yadav',   phone:'9844004400', class_:'Class 11', source:'Website',   date:'2025-06-02', status:'cold',   remarks:'Just checking options' },
  { id:5, no:'ENQ005', name:'Sneha Pandey',  parent:'Vijay Pandey',   phone:'9855005500', class_:'Class 8',  source:'Walk-in',   date:'2025-06-01', status:'warm',   remarks:'Requested school visit' },
  { id:6, no:'ENQ006', name:'Manish Kumar',  parent:'Ajay Kumar',     phone:'9866006600', class_:'Class 10', source:'Phone',     date:'2025-05-31', status:'warm',   remarks:'Follow-up needed' },
];

const INIT_REGISTRATIONS = [
  { id:1, no:'REG001', name:'Riya Gupta',   parent:'Sanjay Gupta',  phone:'9811001100', class_:'Class 6', fee:500, paid:true,  date:'2025-06-05', status:'pending',   enquiryNo:'ENQ001' },
  { id:2, no:'REG002', name:'Rahul Sharma', parent:'Amit Sharma',   phone:'9822002200', class_:'Class 9', fee:500, paid:false, date:'2025-06-04', status:'pending',   enquiryNo:'' },
  { id:3, no:'REG003', name:'Pooja Verma',  parent:'Dinesh Verma',  phone:'9833003300', class_:'Class 7', fee:500, paid:true,  date:'2025-06-03', status:'converted', enquiryNo:'ENQ003' },
];

const INIT_STUDENTS = [
  { id:1,  adm:'ADM2501', name:'Aarav Sharma',  cls:'Class 10', sec:'A', parent:'Rajesh Sharma',  phone:'9876543210', cat:'General', fee:'paid',    status:'active', dob:'2009-03-14', gender:'Male',   blood:'B+', addr:'Hazratganj, Lucknow' },
  { id:2,  adm:'ADM2502', name:'Priya Singh',   cls:'Class 8',  sec:'B', parent:'Manoj Singh',    phone:'9765432100', cat:'OBC',     fee:'pending',  status:'active', dob:'2011-07-22', gender:'Female', blood:'A+', addr:'Gomti Nagar, Lucknow' },
  { id:3,  adm:'ADM2503', name:'Rohit Gupta',   cls:'Class 12', sec:'A', parent:'Suresh Gupta',   phone:'9988776655', cat:'General', fee:'paid',     status:'active', dob:'2007-11-05', gender:'Male',   blood:'O+', addr:'Aliganj, Lucknow' },
  { id:4,  adm:'ADM2504', name:'Ananya Patel',  cls:'Class 6',  sec:'C', parent:'Deepak Patel',   phone:'9765432108', cat:'SC',      fee:'partial',  status:'active', dob:'2013-05-19', gender:'Female', blood:'AB+',addr:'Indira Nagar, Lucknow' },
  { id:5,  adm:'ADM2505', name:'Dev Kumar',     cls:'Class 11', sec:'B', parent:'Anil Kumar',     phone:'9543218760', cat:'General', fee:'pending',  status:'active', dob:'2008-09-30', gender:'Male',   blood:'B-', addr:'Chinhat, Lucknow' },
  { id:6,  adm:'ADM2506', name:'Sakshi Verma',  cls:'Class 9',  sec:'A', parent:'Vivek Verma',    phone:'9812345670', cat:'General', fee:'paid',     status:'active', dob:'2010-12-01', gender:'Female', blood:'O-', addr:'Rajajipuram, Lucknow' },
  { id:7,  adm:'ADM2507', name:'Arjun Mishra',  cls:'Class 7',  sec:'A', parent:'Sunil Mishra',   phone:'9765001234', cat:'OBC',     fee:'paid',     status:'active', dob:'2012-02-17', gender:'Male',   blood:'A-', addr:'Alambagh, Lucknow' },
  { id:8,  adm:'ADM2508', name:'Neha Tiwari',   cls:'Class 10', sec:'B', parent:'Ramesh Tiwari',  phone:'9634567890', cat:'General', fee:'partial',  status:'active', dob:'2009-08-24', gender:'Female', blood:'B+', addr:'Mahanagar, Lucknow' },
  { id:9,  adm:'ADM2509', name:'Vikram Joshi',  cls:'Class 8',  sec:'A', parent:'Kailash Joshi',  phone:'9876001234', cat:'EWS',     fee:'pending',  status:'active', dob:'2011-04-11', gender:'Male',   blood:'AB-',addr:'Vikas Nagar, Lucknow' },
  { id:10, adm:'ADM2510', name:'Kavya Rao',     cls:'Class 6',  sec:'A', parent:'Naresh Rao',     phone:'9754321098', cat:'General', fee:'paid',     status:'active', dob:'2013-01-28', gender:'Female', blood:'O+', addr:'Jankipuram, Lucknow' },
  { id:11, adm:'ADM2511', name:'Pooja Verma',   cls:'Class 7',  sec:'A', parent:'Dinesh Verma',   phone:'9833003300', cat:'General', fee:'pending',  status:'active', dob:'2012-06-10', gender:'Female', blood:'',   addr:'Lucknow' },
];

const admissionSlice = createSlice({
  name: 'admission',
  initialState: {
    enquiries:     INIT_ENQUIRIES,
    registrations: INIT_REGISTRATIONS,
    students:      INIT_STUDENTS,
    classes:       ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'],
  },
  reducers: {

    // ── ENQUIRY ─────────────────────────────────────────
    addEnquiry: (state, { payload }) => {
      const no = `ENQ${String(state.enquiries.length + 1).padStart(3,'0')}`;
      state.enquiries.unshift({ ...payload, id: Date.now(), no, date: new Date().toISOString().split('T')[0] });
    },
    updateEnquiryStatus: (state, { payload: { id, status } }) => {
      const e = state.enquiries.find(x => x.id === id);
      if (e) e.status = status;
    },
    // Convert enquiry → registration
    convertEnquiryToRegistration: (state, { payload: id }) => {
      const enq = state.enquiries.find(x => x.id === id);
      if (!enq) return;
      enq.status = 'converted';
      const no = `REG${String(state.registrations.length + 1).padStart(3,'0')}`;
      state.registrations.unshift({
        id: Date.now(), no,
        name:   enq.name,
        parent: enq.parent,
        phone:  enq.phone,
        class_: enq.class_,
        fee:    500,
        paid:   false,
        date:   new Date().toISOString().split('T')[0],
        status: 'pending',
        enquiryNo: enq.no,
        fromEnquiry: true,
      });
    },

    // ── REGISTRATION ─────────────────────────────────────
    addRegistration: (state, { payload }) => {
      const no = `REG${String(state.registrations.length + 1).padStart(3,'0')}`;
      state.registrations.unshift({ ...payload, id: Date.now(), no, date: new Date().toISOString().split('T')[0], status: 'pending' });
    },
    // Convert registration → student (admission)
    convertRegistrationToStudent: (state, { payload: id }) => {
      const reg = state.registrations.find(x => x.id === id);
      if (!reg) return;
      reg.status = 'converted';
      const newId  = state.students.length + 1;
      const year   = new Date().getFullYear().toString().slice(-2);
      const adm    = `ADM${year}${String(newId).padStart(2,'0')}`;
      state.students.unshift({
        id:     Date.now(),
        adm,
        name:   reg.name,
        cls:    reg.class_,
        sec:    'A',
        parent: reg.parent,
        phone:  reg.phone,
        cat:    'General',
        fee:    'pending',
        status: 'active',
        dob:    '',
        gender: '',
        blood:  '',
        addr:   '',
        fromRegistration: true,
        regNo:  reg.no,
      });
    },

    // ── STUDENT ──────────────────────────────────────────
    addStudent: (state, { payload }) => {
      const newId = state.students.length + 1;
      const year  = new Date().getFullYear().toString().slice(-2);
      const adm   = `ADM${year}${String(newId).padStart(2,'0')}`;
      state.students.unshift({ ...payload, id: Date.now(), adm, fee:'pending', status:'active' });
    },
    updateStudentFee: (state, { payload: { id, fee } }) => {
      const s = state.students.find(x => x.id === id);
      if (s) s.fee = fee;
    },

    // ── CLASS ────────────────────────────────────────────
    addClass: (state, { payload: className }) => {
      if (!state.classes.includes(className)) state.classes.push(className);
    },
  },
});

export const {
  addEnquiry, updateEnquiryStatus, convertEnquiryToRegistration,
  addRegistration, convertRegistrationToStudent,
  addStudent, updateStudentFee,
  addClass,
} = admissionSlice.actions;

export default admissionSlice.reducer;
