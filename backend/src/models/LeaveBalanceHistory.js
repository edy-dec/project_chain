const { DataTypes } = require('sequelize');

// Immutable audit log for every change to an employee's leave balance.
module.exports = (sequelize) => {
  const LeaveBalanceHistory = sequelize.define(
    'LeaveBalanceHistory',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      leaveType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        field: 'leave_type',
      },
      changeAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'change_amount',
        comment: 'Positive = credit, negative = debit',
      },
      balanceAfter: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'balance_after',
      },
      reason: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'leave_balance_history',
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  LeaveBalanceHistory.associate = (models) => {
    LeaveBalanceHistory.belongsTo(models.User, {
      foreignKey: { name: 'userId', field: 'user_id' },
      as: 'employee',
    });
    LeaveBalanceHistory.belongsTo(models.User, {
      foreignKey: { name: 'performedBy', field: 'performed_by' },
      as: 'actor',
    });
  };

  return LeaveBalanceHistory;
};
