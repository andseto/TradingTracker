# SetoTrading — Business Dashboard

Personal owner dashboard for running SetoTrading: track seed money, prop-firm
payouts (gross profit), eval spending, and every receipt — all behind a login.

## Features

- **Overview** — current capital, seed money, gross profit, total spending, net
  profit; monthly cash flow chart (payouts vs. spending), cumulative net profit,
  spending breakdowns by type and firm, eval pass-rate scorecard, recent activity.
- **Expenses** — log purchases with dropdowns for firm, expense type
  (Evaluation, Activation Fee, Reset, Data Fees, …) and outcome (In Progress,
  Passed, Failed, Payout Received, Refunded), plus notes and a receipt attachment.
- **Payouts** — log payouts with firm, method, status (Received / Pending) and
  proof documents. Only *received* payouts count toward gross profit.
- **Receipts** — searchable library of every PDF/image attached to an expense or
  payout, stored in a private Supabase Storage bucket.
- **Settings** — set the seed money (starting capital) and business name.

## One-time Supabase setup

The app uses the Supabase project configured in `.env.local`. Before first use:

1. Open your Supabase project → **SQL Editor**.
2. Paste the entire contents of [`supabase/setup.sql`](supabase/setup.sql) and **Run**.
   It creates the `business_settings`, `expenses`, and `payouts` tables, row-level
   security policies (each user only sees their own data), and a private
   `receipts` storage bucket with per-user access policies. Safe to re-run.
3. Sign up in the app (or create the user under Authentication → Users), and
   you're in.

If the SQL hasn't been run yet, the dashboard shows a setup banner instead of data.

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
```

Stack: Next.js (App Router) · Supabase (auth, Postgres, storage) · Tailwind CSS · Recharts.
