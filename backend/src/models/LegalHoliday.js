const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'LegalHoliday',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      holidayDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'holiday_date' },
      name: { type: DataTypes.STRING(150), allowNull: false },
      country: { type: DataTypes.CHAR(2), defaultValue: 'RO', allowNull: false },
      isRecurring: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_recurring' },
      validFrom: {
        type: DataTypes.DATEONLY,
        defaultValue: '2000-01-01',
        allowNull: false,
        field: 'valid_from',
      },
      validUntil: { type: DataTypes.DATEONLY, allowNull: true, field: 'valid_until' },
    },
    {
      tableName: 'legal_holidays',
      timestamps: true,
      underscored: true,
      indexes: [
        { unique: true, fields: ['holiday_date', 'country'] },
      ],
    }
  );
};
