const { Router } = require('express');
const { getAuth } = require('@clerk/express');
const defaultDb = require('../db');
const { authenticate, syncUser } = require('../middleware/auth');
const { dateRange, monthValue, money, configuredRate, transactionInput, integer, badRequest } = require('../lib/wallet');

const columns = 'id, title, amount, currency, type, notes, spent_at, transaction_date::text AS date, lbp_per_usd';
const supported = "currency IN ('LBP', 'USD') AND lbp_per_usd > 0 AND type IN ('income', 'expense')";
const usd = "CASE WHEN currency = 'USD' THEN amount WHEN currency = 'LBP' THEN amount / lbp_per_usd END";
const lbp = "CASE WHEN currency = 'LBP' THEN amount WHEN currency = 'USD' THEN amount * lbp_per_usd END";

function createTransactionsRouter(db = defaultDb, guards = [authenticate, syncUser]) {
  const router = Router();
  router.use(...guards);

  router.get('/budget', async (req, res) => {
    const month = monthValue(req.query.month);
    const result = await db.query(
      `SELECT amount, currency, month::text FROM budgets
       WHERE user_id = $1 AND category_id IS NULL AND month = $2::date`,
      [getAuth(req).userId, `${month}-01`],
    );
    res.json({ budget: result.rows[0] || null, month });
  });

  router.put('/budget', async (req, res) => {
    const amount = money(req.body.amount, true);
    const month = monthValue(req.body.month);
    const result = await db.query(
      `INSERT INTO budgets (user_id, amount, currency, month)
       VALUES ($1, $2, 'USD', $3::date)
       ON CONFLICT (user_id, month) WHERE category_id IS NULL
       DO UPDATE SET amount = EXCLUDED.amount, currency = 'USD'
       RETURNING amount, currency, month::text`,
      [getAuth(req).userId, amount, `${month}-01`],
    );
    res.json({ budget: result.rows[0], month });
  });

  router.get('/', async (req, res) => {
    const { type = 'all' } = req.query;
    if (!['all', 'income', 'expense'].includes(type)) throw badRequest('Unknown transaction type.');
    const page = integer(req.query.page, 1, 1000000);
    const limit = integer(req.query.limit, 25, 100);
    const range = dateRange(req.query);
    const values = [getAuth(req).userId];
    let where = 'user_id = $1';
    if (range) {
      values.push(range.start, range.interval);
      where += ' AND transaction_date >= $2::date AND transaction_date < $2::date + $3::interval';
    }
    const historyValues = [...values];
    let historyWhere = where;
    if (type !== 'all') {
      historyValues.push(type);
      historyWhere += ` AND type = $${historyValues.length}`;
    }
    // A single snapshot keeps counts, rows, and summary consistent during concurrent writes.
    const client = await db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const transactions = await client.query(
        `SELECT ${columns}, NOT COALESCE((${supported}), false) AS excluded_from_totals
         FROM transactions WHERE ${historyWhere}
         ORDER BY transaction_date DESC, id DESC LIMIT $${historyValues.length + 1} OFFSET $${historyValues.length + 2}`,
        [...historyValues, limit, (page - 1) * limit],
      );
      const count = await client.query(`SELECT COUNT(*)::int AS total FROM transactions WHERE ${historyWhere}`, historyValues);
      const summary = await client.query(
        `WITH eligible AS (
           SELECT *, (${supported}) AS supported,
             CASE WHEN ${supported} THEN ${usd} END AS usd_amount,
             CASE WHEN ${supported} THEN ${lbp} END AS lbp_amount
           FROM transactions WHERE ${where}
         ), sums AS (
           SELECT COALESCE(SUM(usd_amount) FILTER (WHERE type = 'income'), 0) AS income,
             COALESCE(SUM(usd_amount) FILTER (WHERE type = 'expense'), 0) AS expenses,
             COALESCE(SUM(lbp_amount) FILTER (WHERE type = 'income'), 0) AS income_lbp,
             COALESCE(SUM(lbp_amount) FILTER (WHERE type = 'expense'), 0) AS expenses_lbp,
             COUNT(*)::int AS transaction_count,
             COUNT(*) FILTER (WHERE NOT COALESCE(supported, false))::int AS excluded_count
           FROM eligible
         )
         SELECT ROUND(income, 2)::text AS income, ROUND(expenses, 2)::text AS expenses,
           ROUND(income - expenses, 2)::text AS balance,
           ROUND(income_lbp, 2)::text AS "incomeLbp", ROUND(expenses_lbp, 2)::text AS "expensesLbp",
           ROUND(income_lbp - expenses_lbp, 2)::text AS "balanceLbp",
           transaction_count AS "transactionCount", excluded_count AS "excludedCount"
         FROM sums`, values,
      );
      await client.query('COMMIT');
      const totals = summary.rows[0];
      res.json({
        transactions: transactions.rows,
        totals: { ...totals, currency: 'USD', expensesUsd: totals.expenses },
        pagination: { page, limit, total: count.rows[0].total, pages: Math.max(1, Math.ceil(count.rows[0].total / limit)) },
        rate: { lbpPerUsd: configuredRate(), source: 'configured', historical: 'Transaction totals use saved rates.' },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  });

  router.post('/', async (req, res) => {
    const input = transactionInput(req.body);
    const result = await db.query(
      `INSERT INTO transactions (user_id, title, amount, currency, type, notes, transaction_date, spent_at, lbp_per_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $7::date, $8)
       RETURNING ${columns}`,
      [getAuth(req).userId, input.title, input.amount, input.currency, input.type, input.notes, input.date, configuredRate()],
    );
    res.status(201).json({ transaction: result.rows[0] });
  });

  router.put('/:transactionId', async (req, res) => {
    const id = integer(req.params.transactionId, undefined, 2147483647);
    const userId = getAuth(req).userId;
    const existing = await db.query(`SELECT ${columns} FROM transactions WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Transaction not found.' });
    // Preserve omitted fields for older clients and preserve the historical conversion rate.
    const input = transactionInput({ ...existing.rows[0], ...req.body });
    const result = await db.query(
      `UPDATE transactions SET title = $1, amount = $2, currency = $3, type = $4, notes = $5,
         transaction_date = $6::date, spent_at = $6::date, lbp_per_usd = COALESCE(lbp_per_usd, $7)
       WHERE id = $8 AND user_id = $9 RETURNING ${columns}`,
      [input.title, input.amount, input.currency, input.type, input.notes, input.date, configuredRate(), id, userId],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Transaction not found.' });
    res.json({ transaction: result.rows[0] });
  });

  router.delete('/:transactionId', async (req, res) => {
    const id = integer(req.params.transactionId, undefined, 2147483647);
    const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, getAuth(req).userId]);
    if (!result.rowCount) return res.status(404).json({ error: 'Transaction not found.' });
    res.status(204).end();
  });
  return router;
}
module.exports = createTransactionsRouter();
module.exports.createTransactionsRouter = createTransactionsRouter;