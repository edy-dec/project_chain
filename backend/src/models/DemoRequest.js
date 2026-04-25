const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DemoRequest = sequelize.define(
    'DemoRequest',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      fullName: { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
      company: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, validate: { isEmail: true } },
      phone: { type: DataTypes.STRING(50), allowNull: true },
      role: { type: DataTypes.STRING(120), allowNull: false },
      teamSize: { type: DataTypes.STRING(50), allowNull: false, field: 'team_size' },
      focus: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM('new', 'contacted', 'closed'),
        allowNull: false,
        defaultValue: 'new',
      },
    },
    { tableName: 'demo_requests', timestamps: true, underscored: true }
  );

  return DemoRequest;
};
