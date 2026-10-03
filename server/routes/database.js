const { Router } = require('express');
const defaultDb = require('../db');
const { authenticate, syncUser: defaultSyncUser, requireRole } = require('../middleware/auth');

function createDatabaseRouter(db = defaultDb, syncUser = defaultSyncUser) {
const router = Router();

const adminOnly = [authenticate, syncUser, requireRole('admin')];

const getTables = async () => {
  const result = await db.query(`
    SELECT
      c.table_name,
      COALESCE(s.n_live_tup, 0)::int AS estimated_rows
    FROM information_schema.tables c
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = c.table_schema
      AND s.relname = c.table_name
    WHERE c.table_schema = 'public'
      AND c.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  `);

  return result.rows;
};

const getColumns = async (tableName) => {
  const result = await db.query(
    `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows;
};

const assertKnownTable = async (tableName) => {
  const tables = await getTables();
  const table = tables.find((item) => item.table_name === tableName);

  if (!table) {
    const error = new Error('Unknown table');
    error.status = 404;
    throw error;
  }

  return { table, tables };
};

const quoteIdentifier = (identifier) => `"${identifier.replace(/"/g, '""')}"`;

router.get('/tables', adminOnly, async (req, res) => {
  const tables = await getTables();
  res.json({ tables });
});

router.get('/tables/:tableName', adminOnly, async (req, res) => {
  const tableName = req.params.tableName;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const { table } = await assertKnownTable(tableName);
  const quotedTableName = quoteIdentifier(tableName);
  const columns = await getColumns(tableName);
  const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM ${quotedTableName}`);
  const rowsResult = await db.query(
    `SELECT * FROM ${quotedTableName} LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  res.json({
    table,
    columns,
    rows: rowsResult.rows,
    total: countResult.rows[0].total,
    limit,
    offset,
  });
});

return router;
}
module.exports = createDatabaseRouter();
module.exports.createDatabaseRouter = createDatabaseRouter;
