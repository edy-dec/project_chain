const DEPARTMENT_ALIASES = {
  inginerie: 'engineering',
  engineering: 'engineering',
  design: 'design',
  marketing: 'marketing',
  hr: 'hr',
  'human resources': 'hr',
  'resurse umane': 'hr',
  finance: 'finance',
  financiar: 'finance',
  'financiar contabil': 'finance',
  'financiar-contabil': 'finance',
  operations: 'operations',
  operatiuni: 'operations',
  sales: 'sales',
  vanzari: 'sales',
};

const normalizeDepartment = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getDepartmentKey = (value) => {
  const normalized = normalizeDepartment(value);
  if (!normalized) return '';
  if (normalized === 'all' || normalized === 'toate') return 'all';
  return DEPARTMENT_ALIASES[normalized] || normalized;
};

module.exports = { normalizeDepartment, getDepartmentKey };
