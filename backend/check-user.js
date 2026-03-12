require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });

(async () => {
  const [rows] = await sequelize.query(
    `SELECT id, email, role, status, auth0_id FROM users ORDER BY created_at DESC LIMIT 20`
  );
  console.table(rows.map(r => ({ id: r.id, email: r.email, role: r.role, status: r.status, hasAuth0: !!r.auth0Id })));
  await sequelize.close();
})();
