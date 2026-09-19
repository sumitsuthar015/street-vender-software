const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { seedInitialDatabaseData } = require('../services/seedService');

let memoryServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/street_vendor_db';

  try {
    // 1. Try connecting to specified MONGODB_URI with a 3000ms selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB Connected]: ${mongoose.connection.host}`);
    await seedInitialDatabaseData();
  } catch (error) {
    console.warn(`[MongoDB Primary Connection Notice]: Could not connect to ${uri} (${error.message})`);

    // An in-memory database is intentionally opt-in because it loses all data on restart.
    if (process.env.ALLOW_IN_MEMORY_DB !== 'true') {
      throw error;
    }

    // 2. Optional fallback for local demos/tests
    try {
      console.log('[MongoDB Fallback]: Starting MongoMemoryServer in-memory database...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dataPath = path.join(process.cwd(), '.data', 'mongodb');
      fs.mkdirSync(dataPath, { recursive: true });
      memoryServerInstance = await MongoMemoryServer.create({
        instance: { dbPath: dataPath }
      });
      const mongoUri = memoryServerInstance.getUri();

      await mongoose.connect(mongoUri);
      console.log(`[MongoDB Connected]: In-Memory DB ready at ${mongoUri}`);

      // Auto seed initial data
      await seedInitialDatabaseData();
    } catch (memError) {
      console.error('[MongoDB Fallback Error]: Could not start in-memory database:', memError.message);
      console.error('--> Tip: Ensure local MongoDB is running at mongodb://localhost:27017 or set MONGODB_URI in backend/.env');
      throw memError;
    }
  }
};

module.exports = connectDB;
