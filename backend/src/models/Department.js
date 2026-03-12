const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define(
    'Department',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      color: { type: DataTypes.STRING(7), defaultValue: '#1e3a5f' },
    },
    { tableName: 'departments', timestamps: true, underscored: true }
  );

  Department.associate = (models) => {
    Department.hasMany(models.User, { foreignKey: { name: 'departmentId', field: 'department_id' }, as: 'employees' });
    Department.hasMany(models.Shift, { foreignKey: { name: 'departmentId', field: 'department_id' }, as: 'shifts' });
  };

  return Department;
};
