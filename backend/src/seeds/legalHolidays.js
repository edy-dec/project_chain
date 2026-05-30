/**
 * Seed: sarbatori legale Romania 2025 si 2026.
 * Sursa: Codul Muncii art. 139, cu modificarile ulterioare.
 *
 * ATENTIE: datele pentru Vinerea Mare, Pasti si Rusalii sunt mobile
 * (calculate dupa calendarul ortodox) si trebuie adaugate manual pentru fiecare an.
 * Datele de mai jos sunt corecte pentru 2025 si 2026.
 */

const HOLIDAYS = [
  // ── 2025 ──────────────────────────────────────────────────────────────
  { holidayDate: '2025-01-01', name: 'Anul Nou',                       country: 'RO', isRecurring: false },
  { holidayDate: '2025-01-02', name: 'Anul Nou (a doua zi)',           country: 'RO', isRecurring: false },
  { holidayDate: '2025-01-24', name: 'Unirea Principatelor Romane',    country: 'RO', isRecurring: false },
  { holidayDate: '2025-04-18', name: 'Vinerea Mare',                   country: 'RO', isRecurring: false },
  { holidayDate: '2025-04-20', name: 'Pastele (prima zi)',             country: 'RO', isRecurring: false },
  { holidayDate: '2025-04-21', name: 'Pastele (a doua zi)',            country: 'RO', isRecurring: false },
  { holidayDate: '2025-05-01', name: 'Ziua Muncii',                   country: 'RO', isRecurring: false },
  { holidayDate: '2025-06-01', name: 'Ziua Copilului',                country: 'RO', isRecurring: false },
  { holidayDate: '2025-06-08', name: 'Rusalii (prima zi)',             country: 'RO', isRecurring: false },
  { holidayDate: '2025-06-09', name: 'Rusalii (a doua zi)',            country: 'RO', isRecurring: false },
  { holidayDate: '2025-08-15', name: 'Adormirea Maicii Domnului',      country: 'RO', isRecurring: false },
  { holidayDate: '2025-11-30', name: 'Sfantul Andrei',                 country: 'RO', isRecurring: false },
  { holidayDate: '2025-12-01', name: 'Ziua Nationala a Romaniei',      country: 'RO', isRecurring: false },
  { holidayDate: '2025-12-25', name: 'Craciunul (prima zi)',           country: 'RO', isRecurring: false },
  { holidayDate: '2025-12-26', name: 'Craciunul (a doua zi)',          country: 'RO', isRecurring: false },

  // ── 2026 ──────────────────────────────────────────────────────────────
  { holidayDate: '2026-01-01', name: 'Anul Nou',                       country: 'RO', isRecurring: false },
  { holidayDate: '2026-01-02', name: 'Anul Nou (a doua zi)',           country: 'RO', isRecurring: false },
  { holidayDate: '2026-01-24', name: 'Unirea Principatelor Romane',    country: 'RO', isRecurring: false },
  { holidayDate: '2026-04-03', name: 'Vinerea Mare',                   country: 'RO', isRecurring: false },
  { holidayDate: '2026-04-05', name: 'Pastele (prima zi)',             country: 'RO', isRecurring: false },
  { holidayDate: '2026-04-06', name: 'Pastele (a doua zi)',            country: 'RO', isRecurring: false },
  { holidayDate: '2026-05-01', name: 'Ziua Muncii',                   country: 'RO', isRecurring: false },
  { holidayDate: '2026-06-01', name: 'Ziua Copilului / Rusalii (prima zi)', country: 'RO', isRecurring: false },
  { holidayDate: '2026-06-02', name: 'Rusalii (a doua zi)',            country: 'RO', isRecurring: false },
  { holidayDate: '2026-08-15', name: 'Adormirea Maicii Domnului',      country: 'RO', isRecurring: false },
  { holidayDate: '2026-11-30', name: 'Sfantul Andrei',                 country: 'RO', isRecurring: false },
  { holidayDate: '2026-12-01', name: 'Ziua Nationala a Romaniei',      country: 'RO', isRecurring: false },
  { holidayDate: '2026-12-25', name: 'Craciunul (prima zi)',           country: 'RO', isRecurring: false },
  { holidayDate: '2026-12-26', name: 'Craciunul (a doua zi)',          country: 'RO', isRecurring: false },
];

async function seedLegalHolidays(LegalHoliday) {
  let inserted = 0;
  let skipped = 0;
  for (const h of HOLIDAYS) {
    const [, created] = await LegalHoliday.findOrCreate({
      where: { holidayDate: h.holidayDate, country: h.country },
      defaults: h,
    });
    if (created) inserted++;
    else skipped++;
  }
  console.log(`[seed:legalHolidays] inserted=${inserted}, skipped=${skipped}`);
}

module.exports = { seedLegalHolidays };
