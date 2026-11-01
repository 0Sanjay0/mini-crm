require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const users = [
  { name: 'Admin', email: 'admin@crm.com', password: 'Admin@123', role: 'admin' },
  { name: 'John', email: 'john@crm.com', password: 'User@123', role: 'user' },
  { name: 'Priya', email: 'priya@crm.com', password: 'User@123', role: 'user' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const u of users) {
    const passwordHash = await User.hashPassword(u.password);
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, role: u.role, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Seeded users:');
  users.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.password}`));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
