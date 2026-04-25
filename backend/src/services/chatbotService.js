const { GoogleGenerativeAI } = require('@google/generative-ai');
const { User, Attendance, Leave, Salary, Shift } = require('../models');
const { Op } = require('sequelize');
const settingsService = require('./settingsService');

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

class ChatbotService {
  normalizeText(text = '') {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  detectLanguage(text = '') {
    const normalized = this.normalizeText(text);
    const romanianSignals = [
      'concediu',
      'salariu',
      'program',
      'pontaj',
      'cate',
      'cand',
      'luna asta',
      'zile',
      'ore',
      'plata',
    ];

    return romanianSignals.some((token) => normalized.includes(token)) ? 'RO' : 'EN';
  }

  formatDate(dateValue, lang = 'RO') {
    if (!dateValue) return '-';
    return new Date(`${String(dateValue).slice(0, 10)}T00:00:00`).toLocaleDateString(
      lang === 'RO' ? 'ro-RO' : 'en-US',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
  }

  formatMonthYear(month, year, lang = 'RO') {
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
      lang === 'RO' ? 'ro-RO' : 'en-US',
      { month: 'long', year: 'numeric' }
    );
  }

  formatMoney(value, currency = 'RON', lang = 'RO') {
    return `${Number(value || 0).toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }

  formatHours(value, lang = 'RO') {
    return `${Number(value || 0).toLocaleString(lang === 'RO' ? 'ro-RO' : 'en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}h`;
  }

  daysBetween(fromDate, toDate) {
    const start = new Date(`${String(fromDate).slice(0, 10)}T00:00:00`);
    const end = new Date(`${String(toDate).slice(0, 10)}T00:00:00`);
    return Math.round((end - start) / 86400000);
  }

  buildShiftDaysLabel(daysOfWeek = [], lang = 'RO') {
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) return '';
    const ro = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam'];
    const en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = lang === 'RO' ? ro : en;
    return daysOfWeek
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((a, b) => a - b)
      .map((day) => labels[day])
      .join(', ');
  }

  getSalaryStatusLabel(status, lang = 'RO') {
    const map = {
      paid: lang === 'RO' ? 'platit' : 'paid',
      generated: lang === 'RO' ? 'generat' : 'generated',
      draft: 'draft',
    };
    return map[status] || status || '-';
  }

  getLeaveTypeLabel(type, lang = 'RO') {
    const labels = {
      annual: { RO: 'concediu anual', EN: 'annual leave' },
      sick: { RO: 'concediu medical', EN: 'sick leave' },
      personal: { RO: 'concediu personal', EN: 'personal leave' },
      maternity: { RO: 'concediu de maternitate', EN: 'maternity leave' },
      paternity: { RO: 'concediu paternal', EN: 'paternity leave' },
      unpaid: { RO: 'concediu neplatit', EN: 'unpaid leave' },
    };
    return labels[type]?.[lang] || type || '-';
  }

  getNextPayday(today, paydayDay) {
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const candidate = new Date(today.getFullYear(), today.getMonth(), paydayDay);
    if (current <= candidate) return candidate;
    return new Date(today.getFullYear(), today.getMonth() + 1, paydayDay);
  }

  getMonthBounds(year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    return { start, end };
  }

  detectExactIntent(message = '') {
    const text = this.normalizeText(message);

    const hasLeave = /(conced|vacation|leave|zile liber)/.test(text);
    const hasSalary = /(salari|salary|payday|plata salari|ziua de plata)/.test(text);
    const hasSchedule = /(program|schedule|shift|cand lucrez|when do i work)/.test(text);
    const hasHours = /(pontaj|ore|hours worked|worked hours|cat am lucrat|cate ore|overtime|ore suplimentare)/.test(text);

    if (hasLeave && /(pana la conced|pana la urmator|until.*leave|how many days.*leave|cand am conced|when.*leave)/.test(text)) {
      return 'next_leave';
    }
    if (hasLeave && /(anul asta|anul acesta|this year|year to date|year-to-date)/.test(text) && /(luat|luate|taken|used|folosit|folosite|consumat)/.test(text)) {
      return 'leave_taken_year';
    }
    if (hasLeave && /(cate zile|how many.*days|balance|ramase|remaining|mai am)/.test(text)) {
      return 'leave_balance';
    }
    if (hasSalary && /(payday|ziua de plata|cand se plateste|cand primesc salariul|when.*paid|when is my next pay)/.test(text)) {
      return 'payday';
    }
    if ((hasSalary || /payslip|fluturas/.test(text)) && /(ultimele|last|recent|trei|three|3)/.test(text) && /(salarii|salaries|payslips|fluturasi|fluturas)/.test(text)) {
      return 'salary_recent';
    }
    if (hasSalary && /(luna asta|luna aceasta|this month|current month|acum|net|gross|brut)/.test(text)) {
      return 'salary_current';
    }
    if (hasSchedule) {
      return 'schedule';
    }
    if (hasHours && /(luna trecuta|last month)/.test(text) && /(overtime|ore suplimentare)/.test(text)) {
      return 'overtime_last_month';
    }
    if (hasHours) {
      return 'attendance_month';
    }
    return null;
  }

  formatMessages(messages) {
    return messages
      .filter((message) => message && typeof message.content === 'string' && message.content.trim().length > 0)
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));
  }

  async buildContext(userId) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthBounds = this.getMonthBounds(lastMonthYear, lastMonth);
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const [
      settings,
      user,
      todayAttendance,
      currentSalary,
      lastSalary,
      nextApprovedLeave,
      nextPendingLeave,
      monthAttendances,
      yearLeaves,
      lastMonthAttendances,
      recentSalaries,
    ] = await Promise.all([
      settingsService.getSettings(),
      User.findByPk(userId, {
        include: [{ model: Shift, as: 'shift', required: false }],
        attributes: ['id', 'firstName', 'lastName', 'position', 'annualLeaveBalance', 'sickLeaveBalance'],
      }),
      Attendance.findOne({ where: { userId, date: todayStr } }),
      Salary.findOne({ where: { userId, month, year }, order: [['createdAt', 'DESC']] }),
      Salary.findOne({ where: { userId }, order: [['year', 'DESC'], ['month', 'DESC'], ['createdAt', 'DESC']] }),
      Leave.findOne({
        where: { userId, status: 'approved', startDate: { [Op.gte]: todayStr } },
        order: [['startDate', 'ASC']],
      }),
      Leave.findOne({
        where: { userId, status: 'pending', startDate: { [Op.gte]: todayStr } },
        order: [['startDate', 'ASC']],
      }),
      Attendance.findAll({
        where: { userId, date: { [Op.between]: [startOfMonth, todayStr] } },
        attributes: ['totalHours', 'overtimeHours', 'status'],
      }),
      Leave.findAll({
        where: {
          userId,
          status: 'approved',
          startDate: { [Op.between]: [yearStart, yearEnd] },
        },
        attributes: ['type', 'days', 'startDate', 'endDate'],
      }),
      Attendance.findAll({
        where: {
          userId,
          date: { [Op.between]: [lastMonthBounds.start, lastMonthBounds.end] },
        },
        attributes: ['totalHours', 'overtimeHours', 'status'],
      }),
      Salary.findAll({
        where: { userId },
        order: [['year', 'DESC'], ['month', 'DESC'], ['createdAt', 'DESC']],
        limit: 3,
        attributes: ['month', 'year', 'netSalary', 'grossSalary', 'bonusesTotal', 'overtimePay', 'status'],
      }),
    ]);

    const workedHours = monthAttendances.reduce((sum, row) => sum + (+row.totalHours || 0), 0);
    const overtimeHours = monthAttendances.reduce((sum, row) => sum + (+row.overtimeHours || 0), 0);
    const lastMonthOvertimeHours = lastMonthAttendances.reduce((sum, row) => sum + (+row.overtimeHours || 0), 0);
    const workedDays = monthAttendances.reduce((sum, row) => {
      if (row.status === 'half_day') return sum + 0.5;
      if (['present', 'late'].includes(row.status)) return sum + 1;
      return sum;
    }, 0);
    const yearLeaveSummary = yearLeaves.reduce((summary, leave) => {
      const type = leave.type || 'other';
      summary.total += Number(leave.days || 0);
      summary[type] = (summary[type] || 0) + Number(leave.days || 0);
      return summary;
    }, { total: 0 });

    return {
      today,
      todayStr,
      month,
      year,
      lastMonth,
      lastMonthYear,
      paydayDay: settings?.general?.paydayDay ?? 10,
      currency: settings?.general?.currency || 'RON',
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
      position: user?.position || 'N/A',
      shift: user?.shift
        ? {
          name: user.shift.name,
          startTime: user.shift.startTime,
          endTime: user.shift.endTime,
          daysOfWeek: user.shift.daysOfWeek || [],
        }
        : null,
      todayStatus: todayAttendance
        ? todayAttendance.checkOut ? 'checked out' : 'checked in'
        : 'not checked in',
      monthlyHours: workedHours.toFixed(1),
      monthlyDays: Number(workedDays.toFixed(1)),
      monthlyOvertimeHours: overtimeHours.toFixed(1),
      annualLeave: user?.annualLeaveBalance ?? 0,
      sickLeave: user?.sickLeaveBalance ?? 0,
      yearLeaveSummary,
      currentSalary: currentSalary
        ? {
          month: currentSalary.month,
          year: currentSalary.year,
          net: currentSalary.netSalary,
          gross: currentSalary.grossSalary,
          bonuses: currentSalary.bonusesTotal,
          overtimePay: currentSalary.overtimePay,
          status: currentSalary.status,
        }
        : null,
      lastSalary: lastSalary
        ? {
          month: lastSalary.month,
          year: lastSalary.year,
          net: lastSalary.netSalary,
          gross: lastSalary.grossSalary,
          bonuses: lastSalary.bonusesTotal,
          overtimePay: lastSalary.overtimePay,
          status: lastSalary.status,
        }
        : null,
      recentSalaries: recentSalaries.map((salary) => ({
        month: salary.month,
        year: salary.year,
        net: salary.netSalary,
        gross: salary.grossSalary,
        bonuses: salary.bonusesTotal,
        overtimePay: salary.overtimePay,
        status: salary.status,
      })),
      lastMonthOvertimeHours: Number(lastMonthOvertimeHours.toFixed(2)),
      nextApprovedLeave: nextApprovedLeave ? nextApprovedLeave.toJSON() : null,
      nextPendingLeave: nextPendingLeave ? nextPendingLeave.toJSON() : null,
    };
  }

  buildExactReply(intent, ctx, lang = 'RO') {
    if (!intent) return null;

    if (intent === 'leave_balance') {
      return lang === 'RO'
        ? `Mai ai ${ctx.annualLeave} zile de concediu anual si ${ctx.sickLeave} zile de concediu medical disponibile.`
        : `You have ${ctx.annualLeave} annual leave days and ${ctx.sickLeave} sick leave days available.`;
    }

    if (intent === 'leave_taken_year') {
      const annual = ctx.yearLeaveSummary.annual || 0;
      const sick = ctx.yearLeaveSummary.sick || 0;
      const personal = ctx.yearLeaveSummary.personal || 0;
      const total = ctx.yearLeaveSummary.total || 0;

      return lang === 'RO'
        ? `In ${ctx.year} ai luat ${total} zile de concediu aprobate in total: ${annual} anual, ${sick} medical si ${personal} personal.`
        : `In ${ctx.year}, you have taken ${total} approved leave days in total: ${annual} annual, ${sick} sick, and ${personal} personal.`;
    }

    if (intent === 'next_leave') {
      if (ctx.nextApprovedLeave) {
        const leave = ctx.nextApprovedLeave;
        const daysUntil = this.daysBetween(ctx.todayStr, leave.startDate);
        const typeLabel = this.getLeaveTypeLabel(leave.type, lang);

        if (lang === 'RO') {
          if (daysUntil <= 0) {
            return `Urmatorul tau ${typeLabel} incepe astazi, ${this.formatDate(leave.startDate, 'RO')}, si se termina pe ${this.formatDate(leave.endDate, 'RO')}.`;
          }
          return `Mai sunt ${daysUntil} zile pana la urmatorul tau ${typeLabel}. Incepe pe ${this.formatDate(leave.startDate, 'RO')} si se termina pe ${this.formatDate(leave.endDate, 'RO')}.`;
        }

        if (daysUntil <= 0) {
          return `Your next ${typeLabel} starts today, ${this.formatDate(leave.startDate, 'EN')}, and ends on ${this.formatDate(leave.endDate, 'EN')}.`;
        }
        return `${daysUntil} days remain until your next ${typeLabel}. It starts on ${this.formatDate(leave.startDate, 'EN')} and ends on ${this.formatDate(leave.endDate, 'EN')}.`;
      }

      if (ctx.nextPendingLeave) {
        const leave = ctx.nextPendingLeave;
        const typeLabel = this.getLeaveTypeLabel(leave.type, lang);
        return lang === 'RO'
          ? `Nu ai un concediu viitor aprobat acum. Ai insa o cerere in asteptare pentru ${typeLabel}, din ${this.formatDate(leave.startDate, 'RO')} pana in ${this.formatDate(leave.endDate, 'RO')}.`
          : `You do not have an approved upcoming leave right now. You do have a pending ${typeLabel} request from ${this.formatDate(leave.startDate, 'EN')} to ${this.formatDate(leave.endDate, 'EN')}.`;
      }

      return lang === 'RO'
        ? 'Nu ai niciun concediu viitor aprobat in acest moment.'
        : 'You do not have any approved upcoming leave right now.';
    }

    if (intent === 'salary_current') {
      if (ctx.currentSalary) {
        return lang === 'RO'
          ? `Pentru ${this.formatMonthYear(ctx.currentSalary.month, ctx.currentSalary.year, 'RO')} ai salariul ${this.getSalaryStatusLabel(ctx.currentSalary.status, 'RO')}. Net: ${this.formatMoney(ctx.currentSalary.net, ctx.currency, 'RO')}, brut: ${this.formatMoney(ctx.currentSalary.gross, ctx.currency, 'RO')}, overtime: ${this.formatMoney(ctx.currentSalary.overtimePay, ctx.currency, 'RO')}, bonusuri: ${this.formatMoney(ctx.currentSalary.bonuses, ctx.currency, 'RO')}.`
          : `For ${this.formatMonthYear(ctx.currentSalary.month, ctx.currentSalary.year, 'EN')}, your salary is ${this.getSalaryStatusLabel(ctx.currentSalary.status, 'EN')}. Net: ${this.formatMoney(ctx.currentSalary.net, ctx.currency, 'EN')}, gross: ${this.formatMoney(ctx.currentSalary.gross, ctx.currency, 'EN')}, overtime: ${this.formatMoney(ctx.currentSalary.overtimePay, ctx.currency, 'EN')}, bonuses: ${this.formatMoney(ctx.currentSalary.bonuses, ctx.currency, 'EN')}.`;
      }

      if (ctx.lastSalary) {
        return lang === 'RO'
          ? `Pentru ${this.formatMonthYear(ctx.month, ctx.year, 'RO')} nu exista inca un salariu generat. Ultimul salariu disponibil este din ${this.formatMonthYear(ctx.lastSalary.month, ctx.lastSalary.year, 'RO')}: net ${this.formatMoney(ctx.lastSalary.net, ctx.currency, 'RO')}, brut ${this.formatMoney(ctx.lastSalary.gross, ctx.currency, 'RO')}.`
          : `There is no generated salary yet for ${this.formatMonthYear(ctx.month, ctx.year, 'EN')}. Your latest available salary is from ${this.formatMonthYear(ctx.lastSalary.month, ctx.lastSalary.year, 'EN')}: net ${this.formatMoney(ctx.lastSalary.net, ctx.currency, 'EN')}, gross ${this.formatMoney(ctx.lastSalary.gross, ctx.currency, 'EN')}.`;
      }

      return lang === 'RO'
        ? `Nu ai inca niciun salariu generat pentru ${this.formatMonthYear(ctx.month, ctx.year, 'RO')}.`
        : `You do not have a generated salary yet for ${this.formatMonthYear(ctx.month, ctx.year, 'EN')}.`;
    }

    if (intent === 'payday') {
      const nextPayday = this.getNextPayday(ctx.today, ctx.paydayDay);
      return lang === 'RO'
        ? `Urmatoarea zi de plata este ${this.formatDate(nextPayday, 'RO')}.`
        : `Your next payday is ${this.formatDate(nextPayday, 'EN')}.`;
    }

    if (intent === 'salary_recent') {
      if (!ctx.recentSalaries.length) {
        return lang === 'RO'
          ? 'Nu ai inca salarii generate in istoric.'
          : 'You do not have any generated salaries in history yet.';
      }

      const lines = ctx.recentSalaries.map((salary) => (
        `${this.formatMonthYear(salary.month, salary.year, lang)}: net ${this.formatMoney(salary.net, ctx.currency, lang)}, brut ${this.formatMoney(salary.gross, ctx.currency, lang)}, status ${this.getSalaryStatusLabel(salary.status, lang)}`
      ));

      return lang === 'RO'
        ? `Ultimele ${ctx.recentSalaries.length} salarii sunt:\n- ${lines.join('\n- ')}`
        : `Your latest ${ctx.recentSalaries.length} salaries are:\n- ${lines.join('\n- ')}`;
    }

    if (intent === 'schedule') {
      if (!ctx.shift) {
        return lang === 'RO'
          ? 'Nu ai inca un schimb atribuit in sistem.'
          : 'You do not have an assigned shift in the system yet.';
      }

      const daysLabel = this.buildShiftDaysLabel(ctx.shift.daysOfWeek, lang);
      return lang === 'RO'
        ? `Programul tau curent este ${ctx.shift.name}, ${ctx.shift.startTime} - ${ctx.shift.endTime}${daysLabel ? `, in zilele: ${daysLabel}` : ''}.`
        : `Your current schedule is ${ctx.shift.name}, ${ctx.shift.startTime} - ${ctx.shift.endTime}${daysLabel ? `, on: ${daysLabel}` : ''}.`;
    }

    if (intent === 'attendance_month') {
      return lang === 'RO'
        ? `In ${this.formatMonthYear(ctx.month, ctx.year, 'RO')} ai pontate ${ctx.monthlyHours} ore, ${ctx.monthlyDays} zile lucrate si ${ctx.monthlyOvertimeHours} ore suplimentare. Astazi esti ${ctx.todayStatus}.`
        : `In ${this.formatMonthYear(ctx.month, ctx.year, 'EN')}, you have ${ctx.monthlyHours} tracked hours, ${ctx.monthlyDays} worked days, and ${ctx.monthlyOvertimeHours} overtime hours. Today you are ${ctx.todayStatus}.`;
    }

    if (intent === 'overtime_last_month') {
      return lang === 'RO'
        ? `In ${this.formatMonthYear(ctx.lastMonth, ctx.lastMonthYear, 'RO')} ai avut ${this.formatHours(ctx.lastMonthOvertimeHours, 'RO')} de overtime.`
        : `In ${this.formatMonthYear(ctx.lastMonth, ctx.lastMonthYear, 'EN')}, you had ${this.formatHours(ctx.lastMonthOvertimeHours, 'EN')} of overtime.`;
    }

    return null;
  }

  async chat(userId, messages) {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === 'user')?.content || '';
    const lang = this.detectLanguage(lastUserMessage);
    const ctx = await this.buildContext(userId);
    const exactIntent = this.detectExactIntent(lastUserMessage);
    const exactReply = this.buildExactReply(exactIntent, ctx, lang);

    if (exactReply) {
      return exactReply;
    }

    if (!geminiClient) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const system = `You are Chain Assistant, the AI helper for the Chain HR Management platform.
You are professional, friendly and concise. Always respond in the same language as the user's message.

== Employee Context ==
Name: ${ctx.name}
Position: ${ctx.position}
Work Schedule: ${ctx.shift ? `${ctx.shift.name} (${ctx.shift.startTime} - ${ctx.shift.endTime})` : 'Not assigned'}
Today's Status: ${ctx.todayStatus}
This month: ${ctx.monthlyDays} days worked / ${ctx.monthlyHours} h / ${ctx.monthlyOvertimeHours} overtime h
Annual Leave Balance: ${ctx.annualLeave} days
Sick Leave Balance: ${ctx.sickLeave} days
Current month salary: ${ctx.currentSalary ? `Net ${ctx.currentSalary.net} ${ctx.currency} / Gross ${ctx.currentSalary.gross} ${ctx.currency} / Status ${ctx.currentSalary.status}` : 'not generated yet'}
Next approved leave: ${ctx.nextApprovedLeave ? `${ctx.nextApprovedLeave.startDate} to ${ctx.nextApprovedLeave.endDate}` : 'none'}
Payday day of month: ${ctx.paydayDay}${ctx.lastSalary ? `\nLast Salary (${ctx.lastSalary.month}/${ctx.lastSalary.year}): Net ${ctx.lastSalary.net} ${ctx.currency} / Gross ${ctx.lastSalary.gross} ${ctx.currency}` : ''}

== Rules ==
- When the user asks about their own leave balance, salary, schedule, worked hours, payday, or next approved leave, answer using the context exactly and directly.
- If current-month salary is missing, say so clearly instead of guessing.
- Never invent other employees' data.
- Keep answers concise and practical.`;

    const model = geminiClient.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      systemInstruction: system,
    });

    const response = await model.generateContent({
      contents: this.formatMessages(messages),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    });

    return response.response.text();
  }
}

module.exports = new ChatbotService();
