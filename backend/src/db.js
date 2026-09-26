const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./config');

const connect = () =>
  mongoose.connect(config.mongoUri, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 10000,
  });

async function connectDB() {
  try {
    await connect();
  } catch (err) {
    // Atlas "mongodb+srv://" URIs need a DNS SRV lookup. Some Windows/ISP resolvers refuse
    // those (error: "querySrv ECONNREFUSED"), so retry once through public DNS servers.
    if (!/querySrv|ENOTFOUND|ETIMEOUT|ECONNREFUSED/.test(err.message) || !config.mongoUri.startsWith('mongodb+srv')) {
      throw err;
    }
    console.warn('[db] SRV lookup failed with system DNS, retrying with public DNS (8.8.8.8, 1.1.1.1)...');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await connect();
  }
  console.log(`[db] Connected to MongoDB (database: ${config.dbName})`);
}

module.exports = connectDB;
