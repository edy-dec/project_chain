const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Department = require('./Department')(sequelize);
const Shift = require('./Shift')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Leave = require('./Leave')(sequelize);
const Salary = require('./Salary')(sequelize);
const Bonus = require('./Bonus')(sequelize);

const models = { User, Department, Shift, Attendance, Leave, Salary, Bonus };

// Run associations
Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = { ...models, sequelize };
