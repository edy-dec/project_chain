const { DataTypes } = require('sequelize');

// Versioned repository of fiscal/labor rules for Romania.
// Rates and amounts are loaded by services at runtime so legislative changes
// only require a DB update, not a code deployment.
module.exports = (sequelize) => {
  return sequelize.define(
    'TaxRule',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      country: { type: DataTypes.CHAR(2), defaultValue: 'RO', allowNull: false },
      ruleType: {
        type: DataTypes.STRING(80),
        allowNull: false,
        field: 'rule_type',
        comment: 'cas | cass | income_tax | cam | overtime_min_bonus | overtime_compensation_days | sick_employer_days | sick_indemnity_rate | holiday_indemnity_months | annual_min_days | max_overtime_hours_week | max_hours_day',
      },
      rate: {
        type: DataTypes.DECIMAL(8, 6),
        allowNull: true,
        comment: 'Fractional rate, e.g. 0.25 for 25%',
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Absolute amount (days, hours, RON)',
      },
      validFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'valid_from',
      },
      validUntil: { type: DataTypes.DATEONLY, allowNull: true, field: 'valid_until' },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'tax_rules',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['country', 'rule_type', 'valid_from'] },
      ],
    }
  );
};
