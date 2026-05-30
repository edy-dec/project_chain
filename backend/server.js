require('dotenv').config();
const app = require('./app');
const { sequelize, LegalHoliday, TaxRule } = require('./src/models');
const { runSeeds } = require('./src/seeds');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  Database connected successfully');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅  Database synchronised (alter mode)');
      await runSeeds({ LegalHoliday, TaxRule });
    }

    app.listen(PORT, () => {
      console.log(`🚀  Chain API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (error) {
    console.error('❌  Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
