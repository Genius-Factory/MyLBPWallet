-- =========================================================
-- Transactions: transaction date + historical FX rate
-- =========================================================

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS transaction_date DATE;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS lbp_per_usd NUMERIC(18,6);

-- Preserve the original calendar date for legacy transactions.
UPDATE transactions
SET transaction_date = spent_at::date
WHERE transaction_date IS NULL
  AND spent_at IS NOT NULL;

UPDATE transactions
SET transaction_date = created_at::date
WHERE transaction_date IS NULL
  AND created_at IS NOT NULL;

ALTER TABLE transactions
ALTER COLUMN transaction_date SET NOT NULL;

-- Legacy transactions did not store exchange rates.
UPDATE transactions
SET lbp_per_usd = 89500
WHERE lbp_per_usd IS NULL
  AND currency IN ('LBP', 'USD');

-- Add constraint only if it does not already exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_positive_rate'
    ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_positive_rate
        CHECK (lbp_per_usd IS NULL OR lbp_per_usd > 0);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS transactions_user_date_idx
ON transactions(user_id, transaction_date DESC, id DESC);


-- =========================================================
-- Budgets: remove duplicate overall monthly budgets
-- =========================================================

CREATE TABLE IF NOT EXISTS budget_duplicate_backup AS
SELECT
    b.*,
    NOW() AS backed_up_at
FROM budgets b
WHERE false;

INSERT INTO budget_duplicate_backup
SELECT
    b.*,
    NOW()
FROM budgets b
WHERE b.category_id IS NULL
AND EXISTS (
    SELECT 1
    FROM budgets newer
    WHERE newer.user_id = b.user_id
      AND newer.month = b.month
      AND newer.category_id IS NULL
      AND newer.id > b.id
);

DELETE FROM budgets
WHERE id IN (
    SELECT id
    FROM budget_duplicate_backup
);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_overall_user_month_key
ON budgets(user_id, month)
WHERE category_id IS NULL;