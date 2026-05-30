/**
 * Ruleaza toate seed-urile dupa ce tabelele sunt sincronizate.
 * Apelat automat din server.js dupa sequelize.sync().
 */
const { seedLegalHolidays } = require('./legalHolidays');
const { seedTaxRules } = require('./taxRules');

async function runSeeds({ LegalHoliday, TaxRule }) {
  try {
    await seedTaxRules(TaxRule);
    await seedLegalHolidays(LegalHoliday);
    console.log('[seeds] Toate seed-urile au rulat cu succes.');
  } catch (err) {
    console.error('[seeds] Eroare la rulare seed-uri:', err.message);
  }
}

module.exports = { runSeeds };
