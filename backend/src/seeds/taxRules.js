/**
 * Seed: reguli fiscale Romania — versionate cu validFrom/validUntil.
 *
 * Surse:
 *  - Codul Fiscal (Legea 227/2015 cu modificarile ulterioare)
 *  - Codul Muncii (Legea 53/2003 cu modificarile ulterioare)
 *  - OUG 158/2005 (indemnizatii boala)
 *  - Legea 210/1999 (concediu paternitate)
 *
 * ATENTIE: ratele pentru CAM, CAS, CASS si income_tax sunt valabile
 * conform legislatiei cunoscute la data codarii. Verificati ANAF/MF
 * pentru eventuale modificari prin lege bugetara anuala.
 */

const TAX_RULES = [
  // Contributii sociale angajat (Legea 227/2015 art. 138, 156)
  {
    country: 'RO', ruleType: 'cas', rate: 0.25, amount: null,
    validFrom: '2018-01-01', validUntil: null,
    notes: 'CAS 25% — contributie pensii suportata de salariat (Codul Fiscal art. 138)',
  },
  {
    country: 'RO', ruleType: 'cass', rate: 0.10, amount: null,
    validFrom: '2018-01-01', validUntil: null,
    notes: 'CASS 10% — contributie sanatate suportata de salariat (Codul Fiscal art. 156)',
  },
  // Impozit pe venit
  {
    country: 'RO', ruleType: 'income_tax', rate: 0.10, amount: null,
    validFrom: '2018-01-01', validUntil: null,
    notes: 'Impozit pe venit 10% (Codul Fiscal art. 64)',
  },
  // CAM — cost angajator (Legea 227/2015 art. 220^4)
  {
    country: 'RO', ruleType: 'cam', rate: 0.0225, amount: null,
    validFrom: '2018-01-01', validUntil: null,
    notes: 'CAM 2.25% — contributia asiguratorie pentru munca, suportata de angajator (Codul Fiscal art. 220^4)',
  },
  // Ore suplimentare (Codul Muncii art. 122-123)
  {
    country: 'RO', ruleType: 'overtime_min_bonus', rate: 0.75, amount: null,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Spor minim 75% din salariul de baza pentru ore suplimentare necompensate (Codul Muncii art. 123)',
  },
  {
    country: 'RO', ruleType: 'overtime_compensation_days', rate: null, amount: 90,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Termen compensare ore suplimentare cu timp liber: 90 zile calendaristice (Codul Muncii art. 122)',
  },
  // Limite ore de munca (Codul Muncii art. 111, 114, 118)
  {
    country: 'RO', ruleType: 'max_hours_day', rate: null, amount: 10,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Durata maxima a timpului de munca: 10 ore/zi inclusiv ore suplimentare (Codul Muncii art. 111)',
  },
  {
    country: 'RO', ruleType: 'max_overtime_hours_week', rate: null, amount: 8,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Ore suplimentare max 8 ore/saptamana (Codul Muncii art. 118)',
  },
  // Concediu de odihna (Codul Muncii art. 145, 150)
  {
    country: 'RO', ruleType: 'annual_min_days', rate: null, amount: 20,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Durata minima a concediului de odihna: 20 zile lucratoare/an (Codul Muncii art. 145)',
  },
  {
    country: 'RO', ruleType: 'holiday_indemnity_months', rate: null, amount: 3,
    validFrom: '2003-01-01', validUntil: null,
    notes: 'Indemnizatia de concediu = medie venituri ultimele 3 luni (Codul Muncii art. 150)',
  },
  // Concediu medical (OUG 158/2005)
  {
    country: 'RO', ruleType: 'sick_employer_days', rate: null, amount: 5,
    validFrom: '2005-01-01', validUntil: null,
    notes: 'Primele 5 zile de concediu medical platite de angajator (OUG 158/2005 art. 12)',
  },
  {
    country: 'RO', ruleType: 'sick_indemnity_rate', rate: 0.75, amount: null,
    validFrom: '2005-01-01', validUntil: null,
    notes: 'Indemnizatie boala obisnuita: 75% din baza de calcul (media ultimelor 6 luni). OUG 158/2005 art. 10',
  },
];

async function seedTaxRules(TaxRule) {
  let inserted = 0;
  let skipped = 0;
  for (const rule of TAX_RULES) {
    const existing = await TaxRule.findOne({
      where: { country: rule.country, ruleType: rule.ruleType, validFrom: rule.validFrom },
    });
    if (!existing) {
      await TaxRule.create(rule);
      inserted++;
    } else {
      skipped++;
    }
  }
  console.log(`[seed:taxRules] inserted=${inserted}, skipped=${skipped}`);
}

module.exports = { seedTaxRules };
