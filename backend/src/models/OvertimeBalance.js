const { DataTypes } = require('sequelize');

// Tracks uncompensated overtime per 90-day window (Codul Muncii art. 122).
// Overtime is compensated with paid time-off first; if not compensated before
// expirationDate, it must be paid at a minimum 75% bonus rate (art. 123).
module.exports = (sequelize) => {
  const OvertimeBalance = sequelize.define(
    'OvertimeBalance',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      periodStart: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'period_start',
        comment: 'Start of the 90-day compensation window',
      },
      expirationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'expiration_date',
        comment: 'periodStart + 90 days — after this date uncompensated hours must be paid',
      },
      accumulatedHours: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0,
        allowNull: false,
        field: 'accumulated_hours',
      },
      compensatedHours: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0,
        allowNull: false,
        field: 'compensated_hours',
        comment: 'Hours already offset with paid time-off by manager approval',
      },
      paidHours: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0,
        allowNull: false,
        field: 'paid_hours',
        comment: 'Expired uncompensated hours that were included in a salary payment',
      },
    },
    {
      tableName: 'overtime_balance',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['user_id', 'period_start'] },
      ],
    }
  );

  OvertimeBalance.associate = (models) => {
    OvertimeBalance.belongsTo(models.User, {
      foreignKey: { name: 'userId', field: 'user_id' },
      as: 'employee',
    });
  };

  return OvertimeBalance;
};
