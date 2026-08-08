-- ============================================================
-- My LBP Wallet Database Schema (PostgreSQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(255) PRIMARY KEY,
  username   VARCHAR(255) UNIQUE,
  email      VARCHAR(255) UNIQUE NOT NULL,
  role       VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id         SERIAL PRIMARY KEY,
  user_id    VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(120) NOT NULL DEFAULT 'Main Wallet',
  currency   VARCHAR(10) NOT NULL DEFAULT 'LBP',
  balance    NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) UNIQUE NOT NULL,
  type       VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'saving')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id  INTEGER REFERENCES wallet_accounts(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title       VARCHAR(180) NOT NULL,
  amount      NUMERIC(14, 2) NOT NULL,
  currency    VARCHAR(10) NOT NULL DEFAULT 'LBP',
  type        VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'saving')),
  notes       TEXT,
  spent_at    TIMESTAMP DEFAULT NOW(),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id          SERIAL PRIMARY KEY,
  user_id     VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(14, 2) NOT NULL,
  currency    VARCHAR(10) NOT NULL DEFAULT 'LBP',
  month       DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS wallet_accounts_user_id_idx ON wallet_accounts(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_spent_at_idx ON transactions(spent_at);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);

INSERT INTO categories (name, type)
VALUES
  ('Salary', 'income'),
  ('Groceries', 'expense'),
  ('Fuel', 'expense'),
  ('Electricity', 'expense'),
  ('Water', 'expense'),
  ('Savings Goal', 'saving')
ON CONFLICT (name) DO NOTHING;
