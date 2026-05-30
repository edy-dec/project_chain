const { DataTypes } = require('sequelize');

// NOTE: To add 'parental' and 'study' to an existing PostgreSQL database run:
//   ALTER TYPE "enum_leaves_type" ADD VALUE 'parental';
//   ALTER TYPE "enum_leaves_type" ADD VALUE 'study';
// (see migrations/add_leave_types.sql)

module.exports = (sequelize) => {
  const Leave = sequelize.define(
    'Leave',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      type: {
        type: DataTypes.ENUM(
          'annual',    // Concediu de odihna (Codul Muncii art. 145 — min 20 zile lucratoare)
          'sick',      // Concediu medical (OUG 158/2005 — bazat pe certificat, nu sold fix)
          'personal',  // Invoiri platite/neplatite prin CIM sau CCM
          'maternity', // Concediu maternitate (126 zile: 63 prenatal + 63 postnatal)
          'paternity', // Concediu paternitate (5 zile + 10 optionale)
          'parental',  // Concediu crestere copil (pana la 2 ani / 3 ani copil cu handicap)
          'study',     // Concediu studii (Codul Muncii art. 149)
          'unpaid'     // Concediu fara plata
        ),
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
