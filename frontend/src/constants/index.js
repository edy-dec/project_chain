// API base URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// User roles
export const ROLES = {
  ADMIN:    'admin',
  MANAGER:  'manager',
  EMPLOYEE: 'employee',
};

// Leave types
export const LEAVE_TYPES = [
  { value: 'annual',    label: 'Concediu de odihnă' },
  { value: 'sick',      label: 'Concediu medical' },
  { value: 'personal',  label: 'Concediu personal' },
  { value: 'maternity', label: 'Concediu maternitate' },
  { value: 'paternity', label: 'Concediu paternitate' },
  { value: 'unpaid',    label: 'Concediu fără plată' },
];

// Leave status badges
export const LEAVE_STATUS = {
  pending:   { label: 'În așteptare', color: 'warning' },
  approved:  { label: 'Aprobat',      color: 'success' },
  rejected:  { label: 'Respins',      color: 'danger'  },
  cancelled: { label: 'Anulat',       color: 'default' },
};

// Attendance status
export const ATTENDANCE_STATUS = {
  present:   { label: 'Prezent',        color: 'success' },
  absent:    { label: 'Absent',         color: 'danger'  },
  late:      { label: 'Întârziat',      color: 'warning' },
  half_day:  { label: 'Jumătate zi',    color: 'info'    },
  on_leave:  { label: 'În concediu',    color: 'default' },
};

// Month names (Romanian)
export const MONTHS_RO = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie',
];

// Days of week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Duminică' },
  { value: 1, label: 'Luni' },
  { value: 2, label: 'Marți' },
  { value: 3, label: 'Miercuri' },
  { value: 4, label: 'Joi' },
  { value: 5, label: 'Vineri' },
  { value: 6, label: 'Sâmbătă' },
];

export const SALARY_STATUS = {
  draft:     { label: 'Schiță',   color: 'default' },
  generated: { label: 'Generat',  color: 'info'    },
  paid:      { label: 'Plătit',   color: 'success' },
};

export const PAGINATION_LIMIT = 10;
