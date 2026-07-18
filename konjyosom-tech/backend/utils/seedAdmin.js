const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@konjyosomtech.com';
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      // No password configured — generate a random one for first boot.
      adminPassword = require('crypto').randomBytes(12).toString('base64url') + '!A1';
      console.log('⚠️  ADMIN_PASSWORD not set — generated a random one-time admin password (check logs, change after login):', adminPassword);
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true,
        firstLogin: false
      });
      console.log('✅ Admin user seeded successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
