require('dotenv').config();
const db = require('./index');
const { migrate } = require('./migrate');
migrate(db).catch(error => {
  console.error('Migration failed; changes rolled back:', error.message);
  process.exitCode = 1;
}).finally(() => db.end());