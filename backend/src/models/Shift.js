const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shift = sequelize.define(
    'Shift',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
      endTime: { type: DataTypes.TIME, allowNull: false, field: 'end_time' },
      daysOfWeek: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [1, 2, 3, 4, 5],
        field: 'days_of_week',
      },
      breakMinutes: { type: DataTypes.INTEGER, defaultValue: 30, field: 'break_minutes' },
      color: { type: DataTypes.STRING(7), defaultValue: '#22c55e' },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    },
    { tableName: 'shifts', timestamps: true, underscored: true }
  );

  Shift.associate = (models) => {
    Shift.belongsTo(models.Department, { foreignKey: { name: 'departmentId', field: 'department_id' }, as: 'department' });
    Shift.hasMany(models.User, { foreignKey: { name: 'shiftId', field: 'shift_id' }, as: 'employees' });
    Shift.hasMany(models.Attendance, { foreignKey: { name: 'shiftId', field: 'shift_id' }, as: 'attendances' });
  };

  return Shift;
};
