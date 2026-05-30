const getToday = () => new Date().toISOString().split('T')[0];

/**
 * Count working days (Mon–Fri, excluding legal holidays) between two dates inclusive.
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate   - 'YYYY-MM-DD'
 * @param {string[]} holidayDates - array of 'YYYY-MM-DD' strings for legal holidays
 */
const calculateWorkDays = (startDate, endDate, holidayDates = []) => {
  const holidaySet = new Set(holidayDates);
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      const iso = cur.toISOString().split('T')[0];
      if (!holidaySet.has(iso)) count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const getMonthDateRange = (year, month) => ({
  start: `${year}-${String(month).padStart(2, '0')}-01`,
  end: new Date(year, month, 0).toISOString().split('T')[0],
});

/**
 * Fetches legal holiday dates for the given year from the database.
 * Returns an array of 'YYYY-MM-DD' strings.
 * @param {object} LegalHoliday - Sequelize model
 * @param {number} year
 * @param {string} country
 */
const fetchHolidayDates = async (LegalHoliday, year, country = 'RO') => {
  const { Op } = require('sequelize');
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const holidays = await LegalHoliday.findAll({
    where: {
      country,
      holidayDate: { [Op.between]: [start, end] },
      [Op.or]: [{ validUntil: null }, { validUntil: { [Op.gte]: start } }],
    },
    attributes: ['holidayDate'],
  });
  return holidays.map((h) => h.holidayDate);
};

module.exports = { getToday, calculateWorkDays, getMonthDateRange, fetchHolidayDates };
