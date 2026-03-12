const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bonus = sequelize.define(
    'Bonus',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      type: {
        type: DataTypes.ENUM('fixed', 'percentage', 'overtime_multiplier'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      isRecurring: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_recurring' },
      applicableFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'applicable_from',
      },
      applicableTo: { type: DataTypes.DATEONLY, allowNull: true, field: 'applicable_to' },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    },
    { tableName: 'bonuses', timestamps: true, underscored: true }
  );

  Bonus.associate = (models) => {
    Bonus.belongsTo(models.User, { foreignKey: { name: 'userId', field: 'user_id' }, as: 'employee' });
  };

  return Bonus;
};
