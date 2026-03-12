/**
 * Returns the number of Mon-Fri working days in a given month.
 */
const getWorkingDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

/**
 * Sum bonus amounts against a base salary.
 * Supports 'fixed' (flat RON) and 'percentage' (% of base) types.
 */
const calculateBonuses = (bonuses = [], baseSalary = 0) =>
  bonuses.reduce((total, b) => {
    if (!b.isActive) return total;
    if (b.type === 'fixed') return total + +b.amount;
    if (b.type === 'percentage') return total + (baseSalary * +b.amount) / 100;
    return total;
  }, 0);

/**
 * Romanian employee tax contributions (simplified 2024 rules):
 *   CAS  = 25 % of gross (pension)
 *   CASS = 10 % of gross (health)
 *   Income tax = 10 % of (gross - CAS - CASS - personal deduction)
 */
const calculateRomanianTaxes = (grossSalary) => {
  const cas  = grossSalary * 0.25;
  const cass = grossSalary * 0.10;
  const taxableIncome = grossSalary - cas - cass;

  // Simplified personal deduction (0 if taxableIncome > 3000 RON)
  const personalDeduction = taxableIncome <= 3000 ? 500 : 0;
  const taxAmount = Math.max(0, (taxableIncome - personalDeduction) * 0.10);

  const socialContributions = cas + cass;
  const netSalary = Math.max(0, grossSalary - socialContributions - taxAmount);

  return { taxAmount, socialContributions, netSalary };
};

module.exports = { getWorkingDaysInMonth, calculateBonuses, calculateRomanianTaxes };
