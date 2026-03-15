const { GoogleGenerativeAI } = require('@google/generative-ai');
const { User, Attendance, Leave, Salary, Shift } = require('../models');
const { Op } = require('sequelize');

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

class ChatbotService {
  formatMessages(messages) {
    return messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }

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
    if (!geminiClient) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

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

    const model = geminiClient.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      systemInstruction: system,
    });

    const response = await model.generateContent({
      contents: this.formatMessages(messages),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600,
      },
    });

    return response.response.text();
  }
}

module.exports = new ChatbotService();
