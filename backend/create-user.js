/**
 * Creează manual un user cu email-ul specificat și îl face admin.
 * Util când backend-ul nu era pornit la prima logare Auth0.
 *
 * Usage: node create-user.js edy.thereal@gmail.com
 */
require('dotenv').config();
const { sequelize, User } = require('./src/models');

const email = process.argv[2];
if (!email) { console.error('Usage: node create-user.js <email>'); process.exit(1); }

(async () => {
  await sequelize.authenticate();

  // Verifică dacă există deja
  let user = await User.findOne({ where: { email } });

  if (user) {
    // Există – doar updatează rolul la admin
    await user.update({ role: 'admin' });
    console.log(`✅ User "${email}" exista deja. Rol actualizat la admin.`);
  } else {
    // Nu există – creează-l cu rol admin
    const [firstName, ...rest] = email.split('@')[0].split('.');
    user = await User.create({
      email,
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: rest.length > 0 ? rest.join(' ').charAt(0).toUpperCase() + rest.join(' ').slice(1) : '-',
      role: 'admin',
      baseSalary: 0,
      hireDate: new Date(),
      status: 'active',
    });
    console.log(`✅ User "${email}" creat cu succes cu rol admin (id: ${user.id})`);
  }

  console.log('');
  console.log('⚠️  Delogează-te și re-loghează-te în aplicație pentru ca modificarea să aibă efect!');
  await sequelize.close();
})().catch(e => { console.error('❌ Eroare:', e.message); process.exit(1); });
