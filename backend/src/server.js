const config = require('./config');
const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db');
const { initRealtime } = require('./services/realtime');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.disable('x-powered-by');
if (config.isProduction) app.set('trust proxy', 1); // behind Render/Railway/Nginx etc.
app.use((req, res, next) => {
  // Browsers must trust our Content-Type (important for user-uploaded photos)
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// While MongoDB is (re)connecting, answer API calls with a clear message instead of hanging
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ message: 'The server cannot reach the database right now. Please try again in a minute.' });
});

// Webhooks need the raw body for signature checks, so they go before express.json()
app.use('/api/webhooks', require('./routes/webhooks'));
app.use(express.json({ limit: '4mb' })); // photos are sent as base64

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/images', require('./routes/images'));
app.use('/api', require('./routes/public'));
app.use('/api', notFound);

// After `npm run build` in /frontend, this server also serves the website itself
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(errorHandler);

const server = http.createServer(app);
initRealtime(server);

// Start the web server right away (so the frontend gets real error messages),
// then keep trying the database until it connects. No restart needed after fixing Atlas.
server.listen(config.port, () => {
  console.log(`[server] API running on http://localhost:${config.port}`);
  console.log(
    config.payments.mode === 'razorpay'
      ? '[payments] Razorpay is ON (real checkout)'
      : '[payments] DEMO mode: no Razorpay keys in .env, online payments are simulated'
  );
});

const DB_RETRY_SECONDS = 15;
let dbAttempts = 0;

async function startDatabase() {
  dbAttempts += 1;
  try {
    await connectDB();
  } catch (err) {
    if (dbAttempts === 1) {
      console.error('\n[db] Could not connect to MongoDB:', err.message);
      if (/whitelist|any servers/i.test(err.message)) {
        console.error('  - Your internet IP is not allowed in MongoDB Atlas (it changes often on mobile data / hotspot).');
        console.error('  - Fix: Atlas > Security > Network Access > "Add IP Address" > "Add Current IP Address"');
        console.error('    (or "Allow Access from Anywhere" 0.0.0.0/0 while developing). Wait ~1 min for it to become Active.');
      } else if (/auth/i.test(err.message)) {
        console.error('  - Username or password in MONGODB_URI (backend/.env) is wrong.');
        console.error('  - Check Atlas > Security > Database Access.');
      } else {
        console.error('  - Check MONGODB_URI in backend/.env (username, password, cluster address)');
        console.error('  - In MongoDB Atlas > Network Access, allow your current IP address');
      }
    } else {
      console.error(`[db] Still cannot connect (attempt ${dbAttempts}): ${err.message.split('.')[0]}`);
    }
    console.error(`[db] Retrying in ${DB_RETRY_SECONDS} seconds...`);
    setTimeout(startDatabase, DB_RETRY_SECONDS * 1000);
  }
}

startDatabase();
