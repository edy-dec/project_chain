const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Count working days (Mon–Fri) between two date strings inclusive.
 */
const calculateWorkDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const getMonthDateRange = (year, month) => ({
  start: `${year}-${String(month).padStart(2, '0')}-01`,
  end: new Date(year, month, 0).toISOString().split('T')[0],
});

module.exports = { getToday, calculateWorkDays, getMonthDateRange };
