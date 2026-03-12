const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      checkIn: { type: DataTypes.DATE, allowNull: true, field: 'check_in' },
      checkOut: { type: DataTypes.DATE, allowNull: true, field: 'check_out' },
      totalHours: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'total_hours' },
      overtimeHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: 'overtime_hours',
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'on_leave'),
        defaultValue: 'present',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      isManualEntry: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_manual_entry',
      },
      approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
    },
    { tableName: 'attendances', timestamps: true, underscored: true }
  );

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'employee' });
    Attendance.belongsTo(models.Shift, { foreignKey: { name: 'shiftId', field: 'shift_id' }, as: 'shift' });
  };

  return Attendance;
};
