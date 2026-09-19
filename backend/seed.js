require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

const runSeed = async () => {
  try {
    await connectDB();
    console.log('[Seed CLI] Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed CLI Error]:', err);
    process.exit(1);
  }
};

runSeed();
