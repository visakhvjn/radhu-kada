# Radhu

Expense tracker API on Hono. It runs locally or on AWS Lambda, stores data in MongoDB, and serves MCP over HTTP at `/mcp`.

## What it does

- **Add an expense** — `amount` required, `date` defaults to today, optional `description`. Adds the amount to **balance due**.
- **List expenses** — inclusive `from` / `to` dates (`YYYY-MM-DD`).
- **Edit an expense** — change amount, date, or description. If the amount changes, balance due is adjusted by the difference.
- **Record a payment** — `amount` required, `date` defaults to today, optional `note`. Subtracts the amount from balance due.
- **List payments** — inclusive `from` / `to` dates (`YYYY-MM-DD`).
- **Monthly report page** — pick a month (defaults to the current one) to see the total, the change from the previous month, the comparison with the 6-month average and standard deviation, the last 6 months, and every expense listed by date.

Dates use `APP_TIMEZONE` (default `Asia/Kolkata`). Amounts in reports are formatted with `APP_CURRENCY` (default `INR`).

## Setup

```bash
cp .env.example .env
# set MONGODB_URI to local MongoDB or Atlas
npm install
npm run dev
```

API: `http://localhost:3000`  
Report page: `http://localhost:3000/` (redirects to `/reports/monthly`)  
MCP: `http://localhost:3000/mcp`

## HTTP API

No auth for now.

| Method | Path | Body / query |
| --- | --- | --- |
| `POST` | `/expenses` | `{ "amount": 120, "date": "2026-08-17", "description": "groceries" }` |
| `GET` | `/expenses?from=2026-08-01&to=2026-08-31` | |
| `PATCH` | `/expenses/:id` | `{ "amount": 90 }` |
| `POST` | `/payments` | `{ "amount": 500, "note": "upi" }` |
| `GET` | `/payments?from=2026-08-01&to=2026-08-31` | |
| `GET` | `/balance` | |
| `GET` | `/reports/monthly?month=2026-10&format=html` | |
| `GET` | `/health` | |

Add expense and record payment both return the updated `balanceDue`.

`/reports/monthly` renders the report page. `month` defaults to the current month and the dropdown lists every month back to the first recorded expense. `lang=ml|en` switches the page language (Malayalam by default; the choice is remembered in a cookie). `format=json` returns the raw report numbers; `format=email` previews the (not yet sent) monthly email. The 6-month average only counts months that had spending, and needs at least 2 such months.

## MCP

Streamable HTTP MCP is served by the same Hono app at `/mcp` (works locally and on the Lambda Function URL). No auth for now.

Tools: `add_expense`, `list_expenses`, `edit_expense`, `record_payment`, `list_payments`, `get_balance`.

Cursor config (`mcp-server/cursor.mcp.example.json`):

```json
{
  "mcpServers": {
    "radhu": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

After deploy, set `url` to the Function URL plus `/mcp`.

`npm run mcp` is a stdio fallback if a client cannot use HTTP MCP.

## Deploy to Lambda

MongoDB Atlas: allow the Lambda network. For a Function URL outside a VPC, that usually means `0.0.0.0/0` on the Atlas IP access list plus a strong DB user password.

### CDK

```bash
npx cdk bootstrap
npx cdk deploy
```

`MONGODB_URI` is read from `.env` at deploy time. The stack prints `ApiUrl` and `McpUrl`.

### Zip

```bash
npm run build:lambda
```

Upload `dist/radhu-api.zip`. Handler: `index.handler`. Runtime: Node.js 22. Set `MONGODB_URI`, `MONGODB_DB_NAME`, `APP_TIMEZONE`, `APP_CURRENCY`, then add a Function URL.
