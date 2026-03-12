const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Leave = sequelize.define(
    'Leave',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      type: {
        type: DataTypes.ENUM('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid'),
        allowNull: false,
      },
      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
      endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
      days: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending',
      },
      approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true, field: 'rejection_reason' },
      attachmentUrl: { type: DataTypes.STRING, allowNull: true, field: 'attachment_url' },
    },
    { tableName: 'leaves', timestamps: true, underscored: true }
  );

  Leave.associate = (models) => {
    Leave.belongsTo(models.User, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'employee' });
    Leave.belongsTo(models.User, { foreignKey: { name: 'approvedBy', field: 'approved_by' }, as: 'approver' });
  };

  return Leave;
};
