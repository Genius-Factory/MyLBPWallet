const router = require('express').Router();
const db = require('../db');
const { authenticate, syncUser } = require('../middleware/auth');

const signedInOnly = [authenticate, syncUser];

router.get('/', signedInOnly, async (req, res) => {
  const result = await db.query(
    `SELECT id, title, amount, currency, type, notes, spent_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY spent_at DESC, id DESC
     LIMIT 50`,
    [req.auth.userId]
  );

  res.json({ transactions: result.rows });
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