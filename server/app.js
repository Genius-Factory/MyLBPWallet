require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { clerkMiddleware, getAuth } = require('@clerk/express');
const db = require('./db');
const { authenticate, syncUser } = require('./middleware/auth');
const { configuredRate } = require('./lib/wallet');

function createApp(options = {}) {
  const app = express();
  const database = options.db || db;
  configuredRate();
  const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      callback(Object.assign(new Error('This frontend origin is not allowed.'), { status: 403 }));
    },
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use(options.clerkMiddleware || clerkMiddleware());
  if (!options.quiet) {
    morgan.token('user', req => getAuth(req).userId || '-');
    app.use(morgan(':method :url :status :response-time ms user::user'));
  }
  app.get(['/healthz', '/healthz/healthz'], async (req, res) => {
    await database.query('SELECT 1');
    const schema = await database.query("SELECT to_regclass('schema_migrations') AS table_name");
    if (!schema.rows[0].table_name) return res.status(503).json({ status: 'migration_required' });
    const result = await database.query("SELECT version FROM schema_migrations WHERE version = '002_monthly_tracker'");
    if (!result.rowCount) return res.status(503).json({ status: 'migration_required' });
    res.json({ status: 'ok', db: true });
  });
  app.use('/api/transactions', options.transactionsRouter || require('./routes/transactions'));
  app.use('/api/users', options.usersRouter || require('./routes/users'));
  app.use('/api/database', options.databaseRouter || require('./routes/database'));
  app.get('/api/me', authenticate, options.syncUser || syncUser, (req, res) => {
    res.json({ id: getAuth(req).userId, email: req.clerkUser?.emailAddresses?.[0]?.emailAddress, role: req.userRole });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    if (!options.quiet) console.error('Request failed', { method: req.method, path: req.path, code: error.code, message: error.message });
    const message = status === 500
      ? 'The server could not complete this request. Please retry; contact the administrator if it continues.'
      : status === 401 ? 'Please sign in to continue.'
      : error.type === 'entity.parse.failed' ? 'Send a valid JSON request.'
      : error.message;
    res.status(status).json({ error: message });
  });
  return app;
}
module.exports = { createApp };
