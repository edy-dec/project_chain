const OpenAI = require('openai');
const { User, Attendance, Leave, Salary, Shift } = require('../models');
const { Op } = require('sequelize');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class ChatbotService {
  /** Build a lean context object from DB data for the system prompt. */
  async buildContext(userId) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    const [user, todayAtt, lastSalary] = await Promise.all([
      User.findByPk(userId, {
        include: [{ model: Shift, as: 'shift', required: false }],
        attributes: ['id', 'firstName', 'lastName', 'position', 'annualLeaveBalance', 'sickLeaveBalance'],
      }),
      Attendance.findOne({ where: { userId, date: todayStr } }),
      Salary.findOne({ where: { userId, month, year }, order: [['createdAt', 'DESC']] }),
    ]);

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthAtts = await Attendance.findAll({
      where: { userId, date: { [Op.between]: [startOfMonth, todayStr] } },
      attributes: ['totalHours', 'status'],
    });

    const workedHours = monthAtts.reduce((s, a) => s + (+a.totalHours || 0), 0);
    const workedDays = monthAtts.filter((a) => ['present', 'late'].includes(a.status)).length;

    return {
      name: `${user?.firstName} ${user?.lastName}`,
      position: user?.position || 'N/A',
      shift: user?.shift ? `${user.shift.name} (${user.shift.startTime} - ${user.shift.endTime})` : 'Not assigned',
      todayStatus: todayAtt
        ? todayAtt.checkOut ? 'checked out' : 'checked in'
        : 'not checked in',
      monthlyHours: workedHours.toFixed(1),
      monthlyDays: workedDays,
      annualLeave: user?.annualLeaveBalance ?? 0,
      sickLeave: user?.sickLeaveBalance ?? 0,
      lastSalary: lastSalary
        ? { month: lastSalary.month, year: lastSalary.year, net: lastSalary.netSalary, gross: lastSalary.grossSalary }
        : null,
    };
  }

  async chat(userId, messages) {
    const ctx = await this.buildContext(userId);

    const system = `You are Chain Assistant, the AI helper for the Chain HR Management platform.
You are professional, friendly and concise. Always respond in the same language as the user's message.

== Employee Context ==
Name: ${ctx.name}
Position: ${ctx.position}
Work Schedule: ${ctx.shift}
Today's Status: ${ctx.todayStatus}
This month: ${ctx.monthlyDays} days worked / ${ctx.monthlyHours} h
Annual Leave Balance: ${ctx.annualLeave} days
Sick Leave Balance: ${ctx.sickLeave} days${ctx.lastSalary ? `\nLast Salary (${ctx.lastSalary.month}/${ctx.lastSalary.year}): Net ${ctx.lastSalary.net} RON / Gross ${ctx.lastSalary.gross} RON` : ''}

== Capabilities ==
✅ Explain schedule, worked hours, leave balance, salary breakdown.
✅ Guide the user through using the Chain application.
✅ Explain Romanian tax deductions (CAS 25%, CASS 10%, income tax 10%).
❌ Cannot view other employees' data.
❌ Cannot approve/reject requests or modify any records.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: 600,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }
}

module.exports = new ChatbotService();
