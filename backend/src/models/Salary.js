const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Salary = sequelize.define(
    'Salary',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      month: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
      year: { type: DataTypes.INTEGER, allowNull: false },
      baseSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'base_salary' },
      workedDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'worked_days' },
      workedHours: { type: DataTypes.DECIMAL(7, 2), defaultValue: 0, field: 'worked_hours' },

      // Ore suplimentare platite (cele expirate din OvertimeBalance, necompensate cu timp liber)
      overtimeHours: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, field: 'overtime_hours' },
      overtimePay: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'overtime_pay' },

      bonusesTotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'bonuses_total' },

      // Indemnizatie concediu odihna = medie venit zilnic ultimele 3 luni × zile concediu
      holidayIndemnity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'holiday_indemnity' },
      holidayDays: { type: DataTypes.INTEGER, defaultValue: 0, field: 'holiday_days' },

      deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

      // Contributii sociale angajat (separate pentru transparenta)
      casAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'cas_amount' },   // 25%
      cassAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'cass_amount' }, // 10%
      socialContributions: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'social_contributions',
        comment: 'cas_amount + cass_amount',
      },

      taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'tax_amount' },

      // CAM 2.25% — cost angajator, stocat separat pentru rapoarte HR
      camAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'cam_amount' },

      grossSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'gross_salary' },
      netSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'net_salary' },

      status: {
        type: DataTypes.ENUM('draft', 'generated', 'paid'),
        defaultValue: 'draft',
      },
      paidAt: { type: DataTypes.DATE, allowNull: true, field: 'paid_at' },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'salaries', timestamps: true, underscored: true }
  );

  Salary.associate = (models) => {
    Salary.belongsTo(models.User, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'employee' });
  };

  return Salary;
};
