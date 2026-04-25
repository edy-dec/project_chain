const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AppSetting = sequelize.define(
    'AppSetting',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    { tableName: 'app_settings', timestamps: true, underscored: true }
  );

  return AppSetting;
};