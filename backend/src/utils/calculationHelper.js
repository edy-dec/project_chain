const { getDepartmentKey } = require('./departmentHelper');

/**
 * Returns the number of working days (Mon–Fri, excluding legal holidays) in a month.
 * @param {number} year
 * @param {number} month - 1-based
 * @param {string[]} holidayDates - array of 'YYYY-MM-DD' strings for legal holidays
 */
const getWorkingDaysInMonth = (year, month, holidayDates = []) => {
  const holidaySet = new Set(holidayDates);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const day = date.getDay();
    if (day === 0 || day === 6) continue;
    const iso = date.toISOString().split('T')[0];
    if (!holidaySet.has(iso)) count++;
  }
  return count;
};

/**
 * Sums bonus amounts against a base salary.
 * Supports 'fixed' (flat RON) and 'percentage' (% of base) types.
 * 'overtime_multiplier' type is intentionally excluded — overtime is handled
 * via OvertimeBalance, not as a bonus.
 */
const calculateBonuses = (
  bonuses = [],
  baseSalary = 0,
  { employeeDepartment = null, periodStart = null, periodEnd = null } = {}
) => bonuses.reduce((total, b) => {
  if (!b.isActive) return total;

  const appliesTo = b.appliesTo || 'All';
  const appliesToKey = getDepartmentKey(appliesTo);
  const employeeDepartmentKey = getDepartmentKey(employeeDepartment);
  if (
    appliesToKey !== 'all' &&
    employeeDepartmentKey &&
    appliesToKey !== employeeDepartmentKey
  ) {
    return total;
  }

  if (periodStart && b.applicableTo && String(b.applicableTo) < String(periodStart)) return total;
  if (periodEnd && b.applicableFrom && String(b.applicableFrom) > String(periodEnd)) return total;

  if (b.type === 'fixed') return total + +b.amount;
  if (b.type === 'percentage') return total + (baseSalary * +b.amount) / 100;
  return total;
}, 0);

/**
 * Romanian employee tax contributions (2024+ rules, no personal deduction).
 *
 * Formula:
 *   CAS  = grossSalary × casRate          (25% — pensii, salariat)
 *   CASS = grossSalary × cassRate         (10% — sanatate, salariat)
 *   taxableIncome = grossSalary - CAS - CASS
 *   taxAmount = taxableIncome × incomeTaxRate  (10%)
 *   netSalary = grossSalary - CAS - CASS - taxAmount
 *
 *   CAM = grossSalary × camRate           (2.25% — angajator, nu se scade din net)
 *
 * @param {number} grossSalary
 * @param {object} taxRates - overridable rates loaded from TaxRule table
 * @param {number} taxRates.casRate         default 0.25
 * @param {number} taxRates.cassRate        default 0.10
 * @param {number} taxRates.incomeTaxRate   default 0.10
 * @param {number} taxRates.camRate         default 0.0225
 * @param {string|null} fiscalExemption     'it' | 'construction' | 'agriculture' | 'disability' | null
 */
const calculateRomanianTaxes = (grossSalary, taxRates = {}, fiscalExemption = null) => {
  const casRate       = taxRates.casRate       ?? 0.25;
  const cassRate      = taxRates.cassRate      ?? 0.10;
  const incomeTaxRate = taxRates.incomeTaxRate ?? 0.10;
  const camRate       = taxRates.camRate       ?? 0.0225;

  const casAmount  = grossSalary * casRate;
  const cassAmount = grossSalary * cassRate;
  const taxableIncome = grossSalary - casAmount - cassAmount;

  // Facilitate fiscala: scutire impozit pe venit.
  // Statutul exact al facilitatilor pentru 2026 necesita verificare juridica (audit Z-03, Z-04).
  const exemptFromIncomeTax = ['it', 'disability'].includes(fiscalExemption);
  const taxAmount = exemptFromIncomeTax ? 0 : Math.max(0, taxableIncome * incomeTaxRate);

  const socialContributions = casAmount + cassAmount;
  const netSalary = Math.max(0, grossSalary - socialContributions - taxAmount);

  // CAM este cost angajator — nu se scade din salariul net al angajatului
  const camAmount = grossSalary * camRate;

  return {
    casAmount: +casAmount.toFixed(2),
    cassAmount: +cassAmount.toFixed(2),
    socialContributions: +(socialContributions).toFixed(2),
    taxAmount: +taxAmount.toFixed(2),
    camAmount: +camAmount.toFixed(2),
    netSalary: +netSalary.toFixed(2),
  };
};

module.exports = { getWorkingDaysInMonth, calculateBonuses, calculateRomanianTaxes };
