# 💼 Personal Wallet Tracker — Mini Personal Finance App

A lightweight full‑stack personal wallet tracker for managing transactions, budgets, accounts, and basic financial reports with a modern React UI.

> **Live Demo:** *none (local development only)*

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the Database](#2-set-up-the-database)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Dependencies & Run](#4-install-dependencies--run)
- [Seeding the Database](#seeding-the-database)
- [User Roles & Permissions](#user-roles--permissions)
- [API Endpoints](#api-endpoints)
- [Quick‑Start Demo Additions](#quick‑start-demo-additions)
- [Project Structure](#project-structure)

---

## Features

### Core
- **Transactions** – Add, edit, and view transactions (amount, date, category, notes).
- **Accounts** – Manage multiple wallets/accounts (cash, bank, credit cards) and transfer funds between them.
- **Budgets & Categories** – Create categories and monthly budgets to track spending.
- **Reports** – View simple summaries and charts for spending, income, and net balance.
- **Authentication** – Powered by [Clerk](https://clerk.com) with Google/GitHub SSO, email/password, and session management.

### Optional
- **AI Insights** – Generate spending summaries or budget suggestions using OpenAI (optional).

---

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| **Frontend** | React 18, React Router v7, Tailwind CSS, Vite, Lucide Icons |
| **Backend**  | Node.js, Express, Helmet, CORS |
| **Database** | PostgreSQL |
| **Auth**     | Clerk (SSO with Google/GitHub) |
| **AI**       | OpenAI (optional) |

---

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌────────────┐
│   React SPA │──────▶│  Express API │──────▶│ PostgreSQL │
│  (Vite)     │ Clerk │  (Node.js)   │  pg   │            │
│  Port 5173  │ JWT   │  Port 4000   │       │            │
└─────────────┘       └────────────┘       └────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **Clerk account** – optional for SSO
- **OpenAI API key** – optional for AI features

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/personal-wallet-tracker.git
cd personal-wallet-tracker
```

### 2. Set Up the Database

Create a PostgreSQL database and run the schema:

```bash
psql -U postgres -c "CREATE DATABASE wallet_db;"
psql -U postgres -d wallet_db -f server/db/schema.sql
```

### 3. Configure Environment Variables

**Server** – create `server/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/wallet_db
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXX
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXX
PORT=4000
```

**Client** – create `client/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXX
```

### 4. Install Dependencies & Run

```bash
# Terminal 1 – Server
cd server
npm install
npm run dev

# Terminal 2 – Client
cd client
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## Seeding the Database

A seed script creates demo accounts, transactions, and example budgets:

```bash
cd server
node db/seed-demo.js
```

---

## User Roles & Permissions

| Action                              | `user` | `viewer` | `admin` |
|-------------------------------------|-------:|--------:|--------:|
| View transactions list              | ✅      | ✅      | ✅      |
| Create / edit transactions          | ✅      | ❌      | ✅      |
| Manage accounts & transfers         | ✅      | ❌      | ✅      |
| Create budgets                      | ✅      | ❌      | ✅      |
| Generate reports                    | ✅      | ✅      | ✅      |

---

## API Endpoints

### Transactions
| Method | Endpoint                | Auth          | Description |
|--------|------------------------|---------------|-------------|
| `GET`  | `/api/transactions`    | User/Admin    | List transactions |
| `POST` | `/api/transactions`    | User/Admin    | Create transaction |
| `GET`  | `/api/transactions/:id`| User/Admin    | Get transaction details |
| `PUT`  | `/api/transactions/:id`| User/Admin    | Update transaction |
| `DELETE`| `/api/transactions/:id`| Admin        | Delete transaction |

### Accounts & Budgets
| Method | Endpoint                     | Auth          | Description |
|--------|-----------------------------|---------------|-------------|
| `GET`  | `/api/accounts`            | User/Admin    | List accounts |
| `POST` | `/api/accounts`            | User/Admin    | Create account |
| `PUT`  | `/api/accounts/:id`        | User/Admin    | Update account |
| `GET`  | `/api/budgets`             | User/Admin    | List budgets |
| `POST` | `/api/budgets`             | User/Admin    | Create budget |

### Billing / Export
| Method | Endpoint                | Auth          | Description |
|--------|------------------------|---------------|-------------|
| `POST` | `/api/export/csv`       | User/Admin    | Export transactions as CSV |
| `GET`  | `/api/reports/:id`      | User/Admin    | View saved report |

---

## Quick‑Start Demo Additions

The recent changes introduced a minimal **Home page** and a **health‑check** endpoint to verify that the backend can talk to the PostgreSQL database. These additions make it easy to confirm that the whole stack is wired correctly before exploring the full personal finance features.

### Home Page (`/`)

* A new page **HomePage.jsx** displays a friendly greeting and a **"Check DB connection"** button.
* Clicking the button calls the server endpoint `GET /healthz` and shows the JSON response, confirming that the server can reach the database.
* The page also shows the signed‑in user’s email (when logged in) via Clerk.

### Sign‑In / Sign‑Up

* **Sign‑In** is available at `/sign-in` using Clerk’s `SignIn` component.
* A brand‑new **Sign‑Up** page (`/sign-up`) was added with Clerk’s `SignUp` component.
* The navigation bar now includes a **Home** link and Sign‑In/Sign‑Out buttons that work with Clerk.

### Health‑Check Endpoint (`GET /healthz`)

* Implemented in `server/index.js`.
* Returns `{ "status": "ok", "db": true }` when a simple `SELECT 1` query succeeds.
* Useful for automated smoke tests or manual verification via the Home page button.

---

## Project Structure

```
PersonalWallet/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # UI components (Navbar, Charts, etc.)
│   │   ├── contexts/           # Global contexts (Auth, Settings, etc.)
│   │   ├── hooks/              # Custom hooks (useApi, useTransactions)
│   │   ├── lib/                # API client, category lists, constants
│   │   ├── pages/              # Pages: Home, SignIn, SignUp, Transactions, Accounts, Reports
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                     # Express backend
│   ├── db/
│   │   ├── index.js            # PostgreSQL pool
│   │   ├── schema.sql          # Database schema (accounts, transactions, budgets)
│   │   └── seed-demo.js        # Seed script for demo data
│   ├── middleware/
│   │   └── auth.js             # Clerk auth, role checks, user sync
│   ├── routes/
│   │   ├── transactions.js     # CRUD for transactions
│   │   ├── accounts.js         # Account endpoints
│   │   ├── budgets.js          # Budget endpoints
│   │   ├── export.js           # CSV export
│   │   └── ai.js               # Optional AI endpoints
│   ├── index.js                # Express app entry point (includes /healthz)
│   └── package.json
├── .gitignore
└── README.md
```

---

## License

This project is provided as a learning example. Feel free to adapt it for your own personal finance needs or as a reference for building similar apps.
