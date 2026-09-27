const { Pool, types } = require('pg');

// Calendar dates are strings, not instants in the server's local timezone.
types.setTypeParser(1082, value => value);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
module.exports = pool;