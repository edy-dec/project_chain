/**
 * Promovează un utilizator la rol de admin după primul login Auth0.
 * Rulează cu: node make-admin.js <email>
 * Exemplu:    node make-admin.js edyth@gmail.com
 */
require('dotenv').config();
const { sequelize, User } = require('./src/models');

const email = process.argv[2];
if (!email) {
  console.error('❌ Lipsește email-ul. Exemplu: node make-admin.js edyth@gmail.com');
  process.exit(1);
}

async function run() {
  await sequelize.authenticate();
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`❌ Nu există niciun utilizator cu email: ${email}`);
    console.log('   Asigură-te că ai dat login cel puțin o dată în aplicație.');
    process.exit(1);
  }
  await user.update({
    role: 'admin',
    position: user.position || 'Administrator',
    baseSalary: user.baseSalary > 0 ? user.baseSalary : 15000,
    hireDate: user.hireDate || new Date().toISOString().slice(0, 10),
  });
  console.log(`✅ ${user.firstName} ${user.lastName} (${email}) → rol: admin`);
  await sequelize.close();
}

run().catch((err) => { console.error('❌', err.message); process.exit(1); });
