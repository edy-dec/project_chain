/**
 * Seed script – populează baza de date chaindb cu date realiste.
 * Rulează cu: node seed.js
 * Dacă vrei să resetezi tot: node seed.js --reset
 */
require('dotenv').config();
const { sequelize, Department, Shift, User, Attendance, Leave, Salary, Bonus } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

const RESET = process.argv.includes('--reset');

/* ─────────────────────────────────────────────────────────── helpers ── */
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function dateOnly(d) { return d.toISOString().slice(0, 10); }

/* ─────────────────────────────────────────────────────── seed data ── */

const DEPARTMENTS = [
  { name: 'Inginerie Software', description: 'Echipa de dezvoltare produse software', color: '#1e3a5f' },
  { name: 'Resurse Umane',      description: 'Recrutare, training și administrare personal', color: '#22c55e' },
  { name: 'Vânzări',            description: 'Echipa comercială și relații clienți', color: '#f59e0b' },
  { name: 'Marketing',          description: 'Strategie de brand și comunicare', color: '#8b5cf6' },
  { name: 'Financiar-Contabil', description: 'Contabilitate, buget și raportare financiară', color: '#ef4444' },
];

const SHIFTS = [
  { name: 'Zi Standard',   startTime: '09:00:00', endTime: '18:00:00', daysOfWeek: [1,2,3,4,5], breakMinutes: 60,  color: '#22c55e' },
  { name: 'Devreme',       startTime: '07:00:00', endTime: '15:00:00', daysOfWeek: [1,2,3,4,5], breakMinutes: 30,  color: '#3b82f6' },
  { name: 'Seară',         startTime: '14:00:00', endTime: '22:00:00', daysOfWeek: [1,2,3,4,5], breakMinutes: 30,  color: '#f59e0b' },
  { name: 'Weekend+Zi',    startTime: '10:00:00', endTime: '18:00:00', daysOfWeek: [6,0],        breakMinutes: 30,  color: '#8b5cf6' },
];

/* Angajați demo (auth0Id null → nu pot loga, sunt date demo) */
const EMPLOYEES_TPL = [
  { firstName: 'Andrei',    lastName: 'Popescu',   email: 'andrei.popescu@chainhr.ro',   role: 'admin',    position: 'CTO',                     baseSalary: 18000, dept: 0, shift: 0 },
  { firstName: 'Maria',     lastName: 'Ionescu',   email: 'maria.ionescu@chainhr.ro',    role: 'manager',  position: 'HR Manager',              baseSalary: 9500,  dept: 1, shift: 0 },
  { firstName: 'Bogdan',    lastName: 'Constantin',email: 'bogdan.c@chainhr.ro',         role: 'manager',  position: 'Sales Manager',           baseSalary: 10000, dept: 2, shift: 0 },
  { firstName: 'Elena',     lastName: 'Dumitrescu',email: 'elena.d@chainhr.ro',          role: 'employee', position: 'Senior Developer',        baseSalary: 14000, dept: 0, shift: 0 },
  { firstName: 'Mihai',     lastName: 'Georgescu', email: 'mihai.g@chainhr.ro',          role: 'employee', position: 'Full-Stack Developer',    baseSalary: 11500, dept: 0, shift: 0 },
  { firstName: 'Ioana',     lastName: 'Marin',     email: 'ioana.m@chainhr.ro',          role: 'employee', position: 'Frontend Developer',      baseSalary: 9800,  dept: 0, shift: 1 },
  { firstName: 'Radu',      lastName: 'Popa',      email: 'radu.popa@chainhr.ro',        role: 'employee', position: 'DevOps Engineer',         baseSalary: 12500, dept: 0, shift: 0 },
  { firstName: 'Cristina',  lastName: 'Stan',      email: 'cristina.s@chainhr.ro',       role: 'employee', position: 'Recruiter',               baseSalary: 6500,  dept: 1, shift: 0 },
  { firstName: 'Alexandru', lastName: 'Dima',      email: 'alex.dima@chainhr.ro',        role: 'employee', position: 'Account Executive',       baseSalary: 7200,  dept: 2, shift: 0 },
  { firstName: 'Laura',     lastName: 'Matei',     email: 'laura.matei@chainhr.ro',      role: 'employee', position: 'Marketing Specialist',    baseSalary: 6800,  dept: 3, shift: 0 },
  { firstName: 'Florin',    lastName: 'Nistor',    email: 'florin.n@chainhr.ro',         role: 'employee', position: 'Graphic Designer',        baseSalary: 6200,  dept: 3, shift: 1 },
  { firstName: 'Daniela',   lastName: 'Voicu',     email: 'daniela.v@chainhr.ro',        role: 'employee', position: 'Accountant',              baseSalary: 7500,  dept: 4, shift: 0 },
];

/* ─────────────────────────────────────────────────────────── main ── */
async function seed() {
  await sequelize.authenticate();
  console.log('✅ DB conectat\n');

  if (RESET) {
    console.log('⚠️  Resetare date...');
    await Salary.destroy({ where: {} });
    await Attendance.destroy({ where: {} });
    await Leave.destroy({ where: {} });
    await Bonus.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Shift.destroy({ where: {} });
    await Department.destroy({ where: {} });
    console.log('✅ Date șterse\n');
  }

  /* 1. Departamente */
  console.log('📁 Creare departamente...');
  const depts = [];
  for (const d of DEPARTMENTS) {
    const [rec] = await Department.findOrCreate({ where: { name: d.name }, defaults: d });
    depts.push(rec);
  }
  console.log(`   → ${depts.length} departamente\n`);

  /* 2. Schimburi */
  console.log('⏰ Creare schimburi...');
  const shifts = [];
  for (const s of SHIFTS) {
    const [rec] = await Shift.findOrCreate({ where: { name: s.name }, defaults: s });
    shifts.push(rec);
  }
  console.log(`   → ${shifts.length} schimburi\n`);

  /* 3. Angajați */
  console.log('👥 Creare angajați...');
  const users = [];
  for (const tpl of EMPLOYEES_TPL) {
    const deptId  = depts[tpl.dept].id;
    const shiftId = shifts[tpl.shift].id;
    let rec = await User.findOne({ where: { email: tpl.email } });
    if (!rec) {
      rec = await User.create({
        firstName: tpl.firstName,
        lastName:  tpl.lastName,
        email:     tpl.email,
        role:      tpl.role,
        position:  tpl.position,
        baseSalary: tpl.baseSalary,
        hourlyRate: parseFloat((tpl.baseSalary / 160).toFixed(2)),
        hireDate:  dateOnly(daysAgo(rnd(180, 900))),
        phone:     `07${rnd(10,99)}${rnd(100000,999999)}`,
        annualLeaveBalance: rnd(15, 25),
        sickLeaveBalance: 10,
        status: 'active',
      });
    }
    // setăm FK-urile printr-un UPDATE direct
    await sequelize.query(
      `UPDATE users SET department_id = :deptId, shift_id = :shiftId WHERE id = :id`,
      { replacements: { deptId, shiftId, id: rec.id } }
    );
    users.push(rec);
  }
  console.log(`   → ${users.length} angajați\n`);

  /* 4. Bonusuri */
  console.log('🎁 Creare bonusuri...');
  const bonusDefs = [
    { name: 'Bonus performanță Q1', type: 'fixed',      amount: 1500, description: 'Bonus trimestrial performanță', isRecurring: false, applicableFrom: '2026-01-01', applicableTo: '2026-03-31' },
    { name: 'Ore suplimentare x1.5', type: 'overtime_multiplier', amount: 1.5, description: 'Multiplicator ore extra', isRecurring: true, applicableFrom: '2025-01-01' },
    { name: 'Tichete de masă',       type: 'fixed',      amount: 800,  description: '20 tichete × 40 RON', isRecurring: true, applicableFrom: '2025-01-01' },
  ];
  for (const b of bonusDefs) {
    const exists = await Bonus.findOne({ where: { name: b.name } });
    if (!exists) await Bonus.create(b);
  }
  console.log(`   → ${bonusDefs.length} bonusuri\n`);

  /* 5. Pontaj – ultimele 60 zile pentru fiecare angajat */
  console.log('⏱  Generare pontaj (60 zile)...');
  let attCount = 0;
  for (const user of users) {
    for (let i = 1; i <= 60; i++) {
      const day = daysAgo(i);
      const dow = day.getDay(); // 0=Sun, 6=Sat
      if (dow === 0 || dow === 6) continue; // skip weekend

      const dateStr = dateOnly(day);
      const exists = await Attendance.findOne({ where: { user_id: user.id, date: dateStr } });
      if (exists) continue;

      const absent = Math.random() < 0.05;
      const late   = !absent && Math.random() < 0.08;

      if (absent) {
        await Attendance.create({ user_id: user.id, date: dateStr, status: 'absent' });
      } else {
        const inHour  = late ? rnd(10, 11) : 9;
        const inMin   = late ? rnd(5, 45) : rnd(0, 15);
        const outHour = rnd(17, 19);
        const outMin  = rnd(0, 59);

        const checkIn  = new Date(day); checkIn.setHours(inHour, inMin, 0);
        const checkOut = new Date(day); checkOut.setHours(outHour, outMin, 0);
        const totalMs  = checkOut - checkIn;
        const totalHrs = parseFloat((totalMs / 3600000).toFixed(2));
        const overtime = parseFloat(Math.max(0, totalHrs - 8).toFixed(2));

        await Attendance.create({
          user_id: user.id,
          date: dateStr,
          checkIn,
          checkOut,
          totalHours: totalHrs,
          overtimeHours: overtime,
          status: late ? 'late' : 'present',
        });
        attCount++;
      }
    }
  }
  console.log(`   → ${attCount} înregistrări pontaj\n`);

  /* 6. Concedii */
  console.log('🏖  Generare concedii...');
  const leaveTypes = ['annual', 'sick', 'personal'];
  let leaveCount = 0;
  for (const user of users) {
    const numLeaves = rnd(1, 3);
    for (let l = 0; l < numLeaves; l++) {
      const startOffset = rnd(5, 50);
      const days = rnd(2, 7);
      const startDate = dateOnly(daysAgo(startOffset));
      const endD = new Date(daysAgo(startOffset));
      endD.setDate(endD.getDate() + days - 1);
      const endDate = dateOnly(endD);
      const type = leaveTypes[rnd(0, leaveTypes.length - 1)];
      const approved = Math.random() < 0.75;

      const exists = await Leave.findOne({ where: { user_id: user.id, startDate } });
      if (exists) continue;

      await Leave.create({
        user_id: user.id,
        type,
        startDate,
        endDate,
        days,
        reason: type === 'sick' ? 'Concediu medical' : type === 'annual' ? 'Odihnă anuală' : 'Interes personal',
        status: approved ? 'approved' : 'pending',
        approvedBy: approved ? users[0].id : null,
        approvedAt: approved ? new Date() : null,
      });
      leaveCount++;
    }
  }
  console.log(`   → ${leaveCount} cereri concediu\n`);

  /* 7. Salarii – ultimele 3 luni */
  console.log('💰 Generare salarii...');
  let salCount = 0;
  const today = new Date();
  for (const user of users) {
    for (let m = 1; m <= 3; m++) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const month = d.getMonth() + 1;
      const year  = d.getFullYear();

      const exists = await Salary.findOne({ where: { user_id: user.id, month, year } });
      if (exists) continue;

      const base = parseFloat(user.baseSalary);
      const workedDays  = rnd(19, 22);
      const workedHours = parseFloat((workedDays * 8 + rnd(0, 15)).toFixed(2));
      const overtimeHrs = parseFloat((workedHours - workedDays * 8).toFixed(2));
      const overtimePay = parseFloat((overtimeHrs * (base / 160) * 1.75).toFixed(2));
      const bonusesTotal= m === 1 ? parseFloat((base * 0.1).toFixed(2)) : 0;
      const grossSalary = parseFloat((base + overtimePay + bonusesTotal).toFixed(2));
      const taxAmount   = parseFloat((grossSalary * 0.10).toFixed(2));
      const socialContr = parseFloat((grossSalary * 0.25).toFixed(2));
      const deductions  = 0;
      const netSalary   = parseFloat((grossSalary - taxAmount - socialContr - deductions).toFixed(2));

      await Salary.create({
        user_id: user.id,
        month,
        year,
        baseSalary: base,
        workedDays,
        workedHours,
        overtimeHours: overtimeHrs,
        overtimePay,
        bonusesTotal,
        deductions,
        taxAmount,
        socialContributions: socialContr,
        grossSalary,
        netSalary,
        status: m <= 2 ? 'paid' : 'generated',
        paidAt: m <= 2 ? new Date(year, month, 10) : null,
      });
      salCount++;
    }
  }
  console.log(`   → ${salCount} fișe salariale\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Seed complet!');
  console.log(`   Departamente : ${depts.length}`);
  console.log(`   Schimburi    : ${shifts.length}`);
  console.log(`   Angajați     : ${users.length}`);
  console.log(`   Pontaj       : ${attCount}`);
  console.log(`   Concedii     : ${leaveCount}`);
  console.log(`   Salarii      : ${salCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANT: Loghează-te în aplicație o dată,');
  console.log('   apoi rulează: node make-admin.js <email-ul-tău>');

  await sequelize.close();
}

seed().catch((err) => { console.error('❌ Eroare seed:', err.message); process.exit(1); });
