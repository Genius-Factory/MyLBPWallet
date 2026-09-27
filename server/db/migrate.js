const fs = require('node:fs/promises');
const path = require('node:path');

async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(714092018)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const migrations = [
      ['001_initial', path.join(__dirname, 'schema.sql')],
      ['002_monthly_tracker', path.join(__dirname, 'migrations/002_monthly_tracker.sql')],
    ];
    for (const [version, filename] of migrations) {
      const existing = await client.query('SELECT version FROM schema_migrations WHERE version = $1', [version]);
      if (existing.rowCount) continue;
      await client.query(await fs.readFile(filename, 'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [version]);
      console.log(`Applied migration ${version}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { migrate };