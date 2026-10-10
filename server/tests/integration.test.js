const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');
const { migrate } = require('../db/migrate');
const { createApp } = require('../app');
const { authenticate, createSyncUser } = require('../middleware/auth');
const { createTransactionsRouter } = require('../routes/transactions');
const { createUsersRouter } = require('../routes/users');
const { createDatabaseRouter } = require('../routes/database');
const defaultDb = require('../db');

const connectionString = process.env.TEST_DATABASE_URL;
const enabled = Boolean(connectionString);
let pool, admin, server, baseUrl, schema;
const testCase = (name, fn) => test(name, { skip: !enabled }, fn);
const users = {
  alice: { emailAddresses: [{ emailAddress: 'alice@example.test' }], publicMetadata: {} },
  bob: { emailAddresses: [{ emailAddress: 'bob@example.test' }], publicMetadata: {} },
  duplicate: { emailAddresses: [{ emailAddress: 'alice@example.test' }], publicMetadata: {} },
  admin: { emailAddresses: [{ emailAddress: 'admin@example.test' }], publicMetadata: { role: 'admin' } },
};
const clerk = { users: {
  getUser: async id => users[id],
  updateUserMetadata: async (id, data) => { users[id].publicMetadata = data.publicMetadata; },
} };
async function request(route = '', { user = 'alice', method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}/api${route}`, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { 'X-Test-User': user } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: response.status === 204 ? null : await response.json() };
}
const entry = (overrides = {}) => ({ title: 'Salary', amount: '100', currency: 'USD', type: 'income', date: '2026-09-10', ...overrides });

before(async () => {
  if (!enabled) return;
  const target = new URL(connectionString);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.pathname !== '/wallet_test') {
    throw new Error('Integration tests require an isolated local database named wallet_test.');
  }
  process.env.LBP_PER_USD = '89500';
  admin = new Pool({ connectionString, ssl: false });
  schema = `wallet_test_${process.pid}_${Date.now()}`;
  await admin.query(`CREATE SCHEMA "${schema}"`);
  pool = new Pool({ connectionString, ssl: false, options: `-c search_path=${schema}` });
  await migrate(pool);
  const sync = createSyncUser(pool, clerk);
  const app = createApp({
    db: pool, quiet: true, syncUser: sync,
    // This auth fixture is confined to tests. The production app always verifies Clerk.
    clerkMiddleware: (req, res, next) => { req.auth = () => ({ userId: req.headers['x-test-user'] || null, tokenType: 'session_token' }); next(); },
    transactionsRouter: createTransactionsRouter(pool, [authenticate, sync]),
    usersRouter: createUsersRouter(pool, sync, clerk),
    databaseRouter: createDatabaseRouter(pool, sync),
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(async () => {
  if (pool) { await pool.query('TRUNCATE users CASCADE'); process.env.LBP_PER_USD = '89500'; }
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
  if (admin) { await admin.query(`DROP SCHEMA "${schema}" CASCADE`); await admin.end(); }
  await defaultDb.end();
});

testCase('unauthenticated requests return JSON 401; users sync by ID and cannot merge by email', async () => {
  assert.equal((await request('/transactions', { user: null })).status, 401);
  assert.equal((await request('/me')).status, 200);
  assert.equal((await request('/me')).status, 200);
  assert.equal((await request('/me', { user: 'duplicate' })).status, 409);
  const records = await pool.query('SELECT id, username FROM users');
  assert.deepEqual(records.rows, [{ id: 'alice', username: 'alice' }]);
});

testCase('CRUD persists all fields and enforces ownership', async () => {
  const created = await request('/transactions', { method: 'POST', body: entry({ notes: 'Contract work' }) });
  assert.equal(created.status, 201);
  const id = created.data.transaction.id;
  const update = await request(`/transactions/${id}`, { method: 'PUT', body: entry({ title: 'Updated', amount: '125.50', currency: 'LBP', type: 'expense', date: '2026-09-11', notes: 'Edited' }) });
  assert.equal(update.data.transaction.date, '2026-09-11');
  assert.equal(update.data.transaction.notes, 'Edited');
  assert.equal(update.data.transaction.amount, '125.50');
  assert.equal((await request(`/transactions/${id}`, { user: 'bob', method: 'PUT', body: entry() })).status, 404);
  assert.equal((await request(`/transactions/${id}`, { user: 'bob', method: 'DELETE' })).status, 404);
  assert.equal((await request('/transactions?month=2026-09', { user: 'bob' })).data.pagination.total, 0);
  assert.equal((await request('/transactions?month=2026-09')).data.transactions[0].title, 'Updated');
  assert.equal((await request(`/transactions/${id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await request('/transactions?month=2026-09')).data.pagination.total, 0);
});

testCase('mixed currencies use saved decimal rates, filters do not change monthly totals, month bounds are exclusive', async () => {
  await request('/transactions', { method: 'POST', body: entry() });
  const expense = await request('/transactions', { method: 'POST', body: entry({ type: 'expense', currency: 'LBP', amount: '895000', date: '2026-09-30' }) });
  await request('/transactions', { method: 'POST', body: entry({ amount: '500', date: '2026-10-01' }) });
  process.env.LBP_PER_USD = '100000';
  await request(`/transactions/${expense.data.transaction.id}`, { method: 'PUT', body: { title: 'Groceries', amount: '895000' } });
  const result = await request('/transactions?month=2026-09&type=expense');
  assert.equal(result.data.totals.income, '100.00');
  assert.equal(result.data.totals.expenses, '10.00');
  assert.equal(result.data.totals.balance, '90.00');
  assert.equal(result.data.totals.balanceLbp, '8055000.00');
  assert.equal(result.data.transactions[0].lbp_per_usd, '89500.000000');
  assert.equal(result.data.pagination.total, 1);
  assert.equal(result.data.totals.transactionCount, 2);
  assert.equal(result.data.rate.lbpPerUsd, '100000');
});

testCase('category matching is case-insensitive, type-safe, and never duplicates paginated history', async () => {
  const categories = await pool.query(`INSERT INTO categories(name, type)
    VALUES ('Test Food', 'expense'), ('test food', 'expense'), ('TEST FOOD', 'income') RETURNING id`);
  try {
    const expense = await request('/transactions', { method: 'POST', body: entry({ title: 'tEsT fOoD', type: 'expense' }) });
    assert.equal(expense.status, 201);
    assert.equal(expense.data.transaction.category_id, categories.rows[0].id);
    assert.equal(expense.data.transaction.category, 'Test Food');
    const income = await request('/transactions', { method: 'POST', body: entry({ title: 'test food' }) });
    assert.equal(income.data.transaction.category_id, categories.rows[2].id);
    await pool.query(`INSERT INTO transactions(user_id, title, amount, currency, type, transaction_date, lbp_per_usd)
      VALUES ('alice', 'TEST FOOD', 5, 'USD', 'expense', '2026-09-10', 89500)`);
    const first = (await request('/transactions?month=2026-09&limit=2')).data;
    const second = (await request('/transactions?month=2026-09&limit=2&page=2')).data;
    assert.equal(first.pagination.total, 3);
    assert.equal(first.transactions.length, 2);
    assert.equal(second.transactions.length, 1);
    assert.equal(new Set([...first.transactions, ...second.transactions].map(row => row.id)).size, 3);
    assert.equal(first.transactions[0].category, 'Test Food');
    assert.equal(first.transactions[0].category_id, null);
    assert.equal(first.totals.expenses, '105.00');
    assert.equal(first.totals.income, '100.00');
  } finally {
    await pool.query('DELETE FROM categories WHERE id = ANY($1::int[])', [categories.rows.map(row => row.id)]);
  }
});

testCase('category edits clear stale matches and preserve saved categories for unrelated edits', async () => {
  const created = await request('/transactions', { method: 'POST', body: entry() });
  const id = created.data.transaction.id;
  assert.equal(created.data.transaction.category, 'Salary');
  const changeType = await request(`/transactions/${id}`, { method: 'PUT', body: { type: 'expense' } });
  assert.equal(changeType.data.transaction.category_id, null);
  assert.equal(changeType.data.transaction.category, 'Uncategorized');
  const changeTitle = await request(`/transactions/${id}`, { method: 'PUT', body: { title: 'groceries' } });
  assert.equal(changeTitle.data.transaction.category, 'Groceries');
  assert.ok(changeTitle.data.transaction.category_id);
  const unmatched = await request(`/transactions/${id}`, { method: 'PUT', body: { title: 'Weekly shop' } });
  assert.equal(unmatched.data.transaction.category_id, null);
  assert.equal(unmatched.data.transaction.category, 'Uncategorized');
  // Existing explicit assignments take precedence over inferred title matches.
  await pool.query('UPDATE transactions SET category_id = $1 WHERE id = $2', [changeTitle.data.transaction.category_id, id]);
  const notesOnly = await request(`/transactions/${id}`, { method: 'PUT', body: { notes: 'Receipt saved' } });
  assert.equal(notesOnly.data.transaction.category, 'Groceries');
  assert.equal(notesOnly.data.transaction.category_id, changeTitle.data.transaction.category_id);
  const history = (await request('/transactions?month=2026-09')).data;
  assert.equal(history.transactions[0].category, notesOnly.data.transaction.category);
});

testCase('budgets are atomic, month-specific, persist zero, and remain private', async () => {
  const writes = await Promise.all(Array.from({ length: 8 }, (_, i) => request('/transactions/budget', { method: 'PUT', body: { month: '2026-09', amount: String(i) } })));
  assert.ok(writes.every(result => result.status === 200));
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM budgets')).rows[0].count, 1);
  await request('/transactions/budget', { method: 'PUT', body: { month: '2026-09', amount: '0' } });
  assert.equal((await request('/transactions/budget?month=2026-09')).data.budget.amount, '0.00');
  assert.equal((await request('/transactions/budget?month=2026-10')).data.budget, null);
  assert.equal((await request('/transactions/budget?month=2026-09', { user: 'bob' })).data.budget, null);
});

testCase('pagination includes more than 50 entries and legacy currencies are flagged', async () => {
  await request('/me');
  await pool.query(`INSERT INTO transactions(user_id, title, amount, currency, type, transaction_date, lbp_per_usd)
    SELECT 'alice', 'Entry ' || i, 1, 'USD', 'income', '2026-09-12', 89500 FROM generate_series(1, 61) i`);
  await pool.query("INSERT INTO transactions(user_id, title, amount, currency, type, transaction_date) VALUES ('alice', 'Legacy', 10, 'EUR', 'expense', '2026-09-15')");
  const first = (await request('/transactions?month=2026-09')).data;
  assert.equal(first.pagination.total, 62);
  assert.equal(first.pagination.pages, 3);
  assert.equal(first.totals.income, '61.00');
  assert.equal(first.totals.excludedCount, 1);
  assert.equal(first.transactions[0].excluded_from_totals, true);
  assert.deepEqual(
    first.transactions.map(({ date, id }) => [date, id]),
    [...first.transactions].map(({ date, id }) => [date, id])
      .sort(([dateA, idA], [dateB, idB]) => dateB.localeCompare(dateA) || idB - idA),
  );
  const last = (await request('/transactions?month=2026-09&page=3')).data;
  assert.equal(last.transactions.length, 12);
  assert.ok(!first.transactions.some(a => last.transactions.some(b => a.id === b.id)));
});

testCase('validation and admin authorization return safe client errors', async () => {
  for (const body of [entry({ title: ' ' }), entry({ amount: '' }), entry({ amount: '1.001' }), entry({ currency: 'EUR' }), entry({ type: 'saving' }), entry({ date: '2026-02-30' })]) {
    assert.equal((await request('/transactions', { method: 'POST', body })).status, 400);
  }
  assert.equal((await request('/transactions?month=invalid')).status, 400);
  assert.equal((await request('/transactions?page=-1')).status, 400);
  assert.equal((await request('/transactions/budget', { method: 'PUT', body: { amount: '', month: '2026-09' } })).status, 400);
  assert.equal((await request('/users')).status, 403);
  assert.equal((await request('/database/tables')).status, 403);
  assert.equal((await request('/users', { user: 'admin' })).status, 200);
  console.log("suecsussful")
});

testCase('migration backs up duplicate budgets, backfills rates and is repeatable', async () => {
  const legacySchema = `${schema}_legacy`;
  await admin.query(`CREATE SCHEMA "${legacySchema}"`);
  const legacy = new Pool({ connectionString, ssl: false, options: `-c search_path=${legacySchema}` });
  try {
    await legacy.query(await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8'));
    await legacy.query("INSERT INTO users(id,email) VALUES ('legacy','legacy@example.test')");
    await legacy.query("INSERT INTO budgets(user_id,amount,month) VALUES ('legacy',100,'2026-09-01'), ('legacy',200,'2026-09-01')");
    await legacy.query("INSERT INTO transactions(user_id,title,amount,type,spent_at) VALUES ('legacy','Before migration',89500,'expense','2026-09-30 23:59:00')");
    await migrate(legacy);
    await migrate(legacy);
    assert.equal((await legacy.query('SELECT amount FROM budgets')).rows[0].amount, '200.00');
    assert.equal((await legacy.query('SELECT amount FROM budget_duplicate_backup')).rows[0].amount, '100.00');
    assert.equal((await legacy.query('SELECT transaction_date::text AS date, lbp_per_usd FROM transactions')).rows[0].date, '2026-09-30');
    assert.equal((await legacy.query('SELECT lbp_per_usd FROM transactions')).rows[0].lbp_per_usd, '89500.000000');
    assert.equal((await legacy.query('SELECT COUNT(*)::int AS count FROM schema_migrations')).rows[0].count, 2);
  } finally { await legacy.end(); await admin.query(`DROP SCHEMA "${legacySchema}" CASCADE`); }
});

testCase('a failing migration rolls back the entire batch', async () => {
  const brokenSchema = `${schema}_broken`;
  await admin.query(`CREATE SCHEMA "${brokenSchema}"`);
  const broken = new Pool({ connectionString, ssl: false, options: `-c search_path=${brokenSchema}` });
  try {
    await broken.query(await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8'));
    await broken.query('ALTER TABLE transactions DROP COLUMN spent_at');
    await assert.rejects(() => migrate(broken));
    const result = await broken.query("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'transactions' AND column_name = 'lbp_per_usd'", [brokenSchema]);
    assert.equal(result.rowCount, 0);
  } finally { await broken.end(); await admin.query(`DROP SCHEMA "${brokenSchema}" CASCADE`); }
});
