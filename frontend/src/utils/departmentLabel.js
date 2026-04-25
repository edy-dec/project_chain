const DEPARTMENT_TRANSLATION_KEYS = {
  engineering: 'dept.engineering',
  design: 'dept.design',
  marketing: 'dept.marketing',
  hr: 'dept.hr',
  finance: 'dept.finance',
  operations: 'dept.operations',
  sales: 'dept.sales',
};

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

const deptName = (value) => (value && typeof value === 'object' ? value.name : value);

export const normalizeDepartment = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getDepartmentKey = (value) => {
  const raw = deptName(value);
  const normalized = normalizeDepartment(raw || '');
  if (!normalized) return '';
  if (normalized === 'all' || normalized === 'toate') return 'all';
  return DEPARTMENT_ALIASES[normalized] || normalized;
};

export const getDepartmentLabel = (value, t, options = {}) => {
  const raw = deptName(value);
  const fallback = options.fallback || '-';
  if (!raw) return fallback;

  const key = getDepartmentKey(raw);
  if (key === 'all' && options.allKey) return t(options.allKey);

  const translationKey = DEPARTMENT_TRANSLATION_KEYS[key];
  return translationKey ? t(translationKey) : raw;
};
