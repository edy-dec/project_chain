const { DataTypes } = require('sequelize');

// Situatii speciale de munca in afara locatiei obisnuite.
//
// Tipuri acoperite:
//  delegation  — Delegatie (Codul Muncii art. 42): angajat trimis la alta locatie,
//                acelasi angajator, max 60 zile, diurna aplicabila.
//  detachment  — Detasare (CM art. 45): angajat trimis la alt angajator.
//  field_work  — Activitate pe teren (vizite clienti, inspectii, santier).
//  remote      — Telemunca / munca la domiciliu (Legea 81/2018).
//  transport   — Timp de conducere / deplasare care se incadreaza ca timp de munca.
//  training    — Training extern, conferinta, eveniment profesional.

module.exports = (sequelize) => {
  const FieldActivity = sequelize.define(
    'FieldActivity',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

      activityType: {
        type: DataTypes.ENUM(
          'delegation',  // Delegatie — CM art. 42
          'detachment',  // Detasare  — CM art. 45
          'field_work',  // Activitate pe teren
          'remote',      // Telemunca — Legea 81/2018
          'transport',   // Timp de deplasare/conducere
          'training'     // Training extern / conferinta
        ),
        allowNull: false,
        field: 'activity_type',
      },

      // Locatia unde s-a desfasurat activitatea
      destination: { type: DataTypes.STRING(255), allowNull: true },

      startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
      endDate:   { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },

      // Ora de inceput/sfarsit (pentru activitati intr-o singura zi)
      startTime: { type: DataTypes.TIME, allowNull: true, field: 'start_time' },
      endTime:   { type: DataTypes.TIME, allowNull: true, field: 'end_time' },

      totalDays:  { type: DataTypes.DECIMAL(5, 1), defaultValue: 0, field: 'total_days' },
      totalHours: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0, field: 'total_hours' },

      // Diurna/indemnizatie de deplasare (RON/zi, configurabila in AppSettings)
      // NOTA: plafonul neimpozabil = 2.5x indemnizatia de referinta (Codul Fiscal art. 76).
      // Statutul exact pentru 2026 necesita verificare juridica.
      dailyAllowance:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'daily_allowance' },
      totalAllowance:  { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'total_allowance' },

      // Cheltuieli decontate
      transportCost:     { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'transport_cost' },
      accommodationCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'accommodation_cost' },
      otherCosts:        { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'other_costs' },

      // Indica daca totalAllowance depaseste plafonul neimpozabil
      // (trebuie inclus in venitul impozabil la generarea statului de plata)
      isTaxable: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_taxable' },

      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },

      approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true, field: 'rejection_reason' },

      notes:         { type: DataTypes.TEXT, allowNull: true },
      attachmentUrl: { type: DataTypes.STRING, allowNull: true, field: 'attachment_url' },

      // Link optional la inregistrarea de pontaj din ziua respectiva
      attendanceId: { type: DataTypes.UUID, allowNull: true, field: 'attendance_id' },
    },
    {
      tableName: 'field_activities',
      timestamps: true,
      underscored: true,
    }
  );

  FieldActivity.associate = (models) => {
    FieldActivity.belongsTo(models.User, {
      foreignKey: { name: 'userId', field: 'user_id' },
      as: 'employee',
    });
    FieldActivity.belongsTo(models.User, {
      foreignKey: { name: 'approvedBy', field: 'approved_by' },
      as: 'approver',
    });
    FieldActivity.belongsTo(models.Attendance, {
      foreignKey: { name: 'attendanceId', field: 'attendance_id' },
      as: 'attendance',
    });
  };

  return FieldActivity;
};
