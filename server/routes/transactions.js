const router = require('express').Router();
const db = require('../db');
const { authenticate, syncUser } = require('../middleware/auth');


const signedInOnly = [authenticate, syncUser];
const LBP_PER_USD = 89500;

router.get('/budget', signedInOnly, async (req, res) => {
  const result = await db.query(
    `SELECT amount, currency
     FROM budgets
     WHERE user_id = $1 AND category_id IS NULL
       AND month = date_trunc('month', CURRENT_DATE)::date
     LIMIT 1`,
    [req.auth.userId]
  );

  res.json({
    budget: result.rows[0]
      ? { amount: Number(result.rows[0].amount), currency: result.rows[0].currency }
      : null,
  });
});

router.put('/budget', signedInOnly, async (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: 'A non-negative budget amount is required' });
  }

  const existing = await db.query(
    `SELECT id
     FROM budgets
     WHERE user_id = $1 AND category_id IS NULL
       AND month = date_trunc('month', CURRENT_DATE)::date
     LIMIT 1`,
    [req.auth.userId]
  );

  const result = existing.rowCount > 0
    ? await db.query(
      `UPDATE budgets
       SET amount = $1, currency = 'USD'
       WHERE id = $2
       RETURNING amount, currency`,
      [amount, existing.rows[0].id]
    )
    : await db.query(
      `INSERT INTO budgets (user_id, amount, currency, month)
       VALUES ($1, $2, 'USD', date_trunc('month', CURRENT_DATE)::date)
       RETURNING amount, currency`,
      [req.auth.userId, amount]
    );

  res.json({
    budget: { amount: Number(result.rows[0].amount), currency: result.rows[0].currency },
  });
});

router.get('/', signedInOnly, async (req, res) => {
  const { period = 'all', type = 'all' } = req.query;
  const values = [req.auth.userId];
  const conditions = ['user_id = $1'];

  if (type === 'income' || type === 'expense') {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  if (period === 'today') {
    conditions.push('spent_at >= CURRENT_DATE AND spent_at < CURRENT_DATE + INTERVAL \'1 day\'');
  } else if (period === 'this-month') {
    conditions.push("spent_at >= date_trunc('month', CURRENT_DATE) AND spent_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'");
  } else if (period === 'previous-month') {
    conditions.push("spent_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND spent_at < date_trunc('month', CURRENT_DATE)");
  }

  const whereClause = conditions.join(' AND ');
  const [transactionsResult, totalsResult, categoriesResult] = await Promise.all([
    db.query(
      `SELECT id, title, amount, currency, type, notes, spent_at
       FROM transactions
       WHERE ${whereClause}
       ORDER BY spent_at DESC, id DESC
       LIMIT 50`,
      values
    ),
    db.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
         COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses,
         COALESCE(SUM(
           CASE
             WHEN type = 'expense' AND currency = 'USD' THEN amount
             WHEN type = 'expense' AND currency = 'LBP' THEN amount / ${LBP_PER_USD}
             ELSE 0
           END
         ), 0) AS expenses_usd
       FROM transactions
       WHERE ${whereClause}`,
      values
    ),
    db.query(
      `SELECT title AS category, type, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE ${whereClause}
       GROUP BY title, type
       ORDER BY total DESC, title ASC`,
      values
    ),
  ]);

  const income = Number(totalsResult.rows[0].income);
  const expenses = Number(totalsResult.rows[0].expenses);
  const expensesUsd = Number(totalsResult.rows[0].expenses_usd);

  res.json({
    transactions: transactionsResult.rows,
    totals: { income, expenses, expensesUsd, balance: income - expenses },
    categories: categoriesResult.rows.map((row) => ({
      category: row.category,
      type: row.type,
      total: Number(row.total),
    })),
  });
});

router.post('/', signedInOnly, async (req, res) => {
  const { title, amount, currency = 'LBP', type = 'expense', notes = null } = req.body;

  if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A title and a positive amount are required' });
  }

  const result = await db.query(
    `INSERT INTO transactions (user_id, title, amount, currency, type, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, amount, currency, type, notes, spent_at`,
    [req.auth.userId, title.trim(), Number(amount), currency, type, notes]
  );

  res.status(201).json({ transaction: result.rows[0] });
});

router.put('/:transactionId', signedInOnly, async (req, res) => {
  const { title, amount } = req.body;

  if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A title and a positive amount are required' });
  }

  const result = await db.query(
    `UPDATE transactions
     SET title = $1, amount = $2
     WHERE id = $3 AND user_id = $4
     RETURNING id, title, amount, currency, type, notes, spent_at`,
    [title.trim(), Number(amount), req.params.transactionId, req.auth.userId]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ transaction: result.rows[0] });
});

router.delete('/:transactionId', signedInOnly, async (req, res) => {
  const result = await db.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.transactionId, req.auth.userId]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
  res.status(204).end();
});

module.exports = router;