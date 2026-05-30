const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Department = require('./Department')(sequelize);
const Shift = require('./Shift')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Leave = require('./Leave')(sequelize);
const Salary = require('./Salary')(sequelize);
const Bonus = require('./Bonus')(sequelize);
const AppSetting = require('./AppSetting')(sequelize);
const DemoRequest = require('./DemoRequest')(sequelize);
const LegalHoliday = require('./LegalHoliday')(sequelize);
const OvertimeBalance = require('./OvertimeBalance')(sequelize);
const TaxRule = require('./TaxRule')(sequelize);
const LeaveBalanceHistory = require('./LeaveBalanceHistory')(sequelize);
const FieldActivity = require('./FieldActivity')(sequelize);

const models = {
  User, Department, Shift, Attendance, Leave, Salary, Bonus,
  AppSetting, DemoRequest, LegalHoliday, OvertimeBalance, TaxRule, LeaveBalanceHistory, FieldActivity,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { ...models, sequelize };
