const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      auth0Id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
        field: 'auth0_id',
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 100] },
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 100] },
        field: 'last_name',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'employee'),
        defaultValue: 'employee',
        allowNull: false,
      },
      position: { type: DataTypes.STRING(150), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      baseSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'base_salary',
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        field: 'hourly_rate',
      },
      hireDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'hire_date',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      avatar: { type: DataTypes.STRING, allowNull: true },
      annualLeaveBalance: {
        type: DataTypes.INTEGER,
        defaultValue: 21,
        field: 'annual_leave_balance',
      },
      sickLeaveBalance: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        field: 'sick_leave_balance',
      },
    },
    { tableName: 'users', timestamps: true, underscored: true }
  );

  User.associate = (models) => {
    User.belongsTo(models.Department, { foreignKey: { name: 'departmentId', field: 'department_id' }, as: 'department' });
    User.belongsTo(models.Shift, { foreignKey: { name: 'shiftId', field: 'shift_id' }, as: 'shift' });
    User.hasMany(models.Attendance, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'attendances' });
    User.hasMany(models.Leave, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'leaves' });
    User.hasMany(models.Salary, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'salaries' });
    User.hasMany(models.Bonus, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'bonuses' });
  };

  return User;
};
