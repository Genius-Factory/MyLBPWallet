require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./index');

async function runMigration() {
  const client = await pool.connect();

  try {
    const migrationPath = path.join(
      __dirname,
      'migrations',
      '002_monthly_tracker.sql'
    );

    const sql = await fs.readFile(migrationPath, 'utf8');

    console.log('Running 002_monthly_tracker.sql...');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();