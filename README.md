<div align="center">

# Ventorio — Enterprise Inventory Management System

**A full-stack inventory platform for warehouses, procurement, sales, and operations teams.**

React · TypeScript · FastAPI · PostgreSQL · Resend

<br/>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)

[Features](#features) · [List views](#list-views-search-sort--pagination) · [Flows](#application-flows) · [Getting Started](#getting-started) · [API](#api-reference) · [Schema](#database-schema)

</div>

---

Ventorio centralizes **product catalog**, **multi-warehouse stock**, **procurement**, **sales orders**, **audits**, **forecasting**, and **reporting** in one dashboard — with **role-based access** so each team member sees only what they need.

| | |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend** | FastAPI + SQLAlchemy + Alembic (domain-split services) |
| **Database** | PostgreSQL (30+ tables) |
| **Auth** | JWT (Bearer) + bcrypt + optional Google OAuth |
| **Email** | Resend for low-stock and critical alerts |

---

## Table of Contents

- [Features](#features)
- [List views: search, sort & pagination](#list-views-search-sort--pagination)
- [Tech Stack](#tech-stack)
- [Application Flows](#application-flows)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

---

## Features

### Core modules

| Module | Capabilities |
|--------|-------------|
| **Auth & RBAC** | JWT login/register, 6 roles, permission matrix, activity & login logs |
| **Product catalog** | SKU, variants, barcodes, subcategories, server-side search/sort/pagination |
| **Inventory & WMS** | Multi-warehouse balances, stock movements ledger, transfers, cycle counts |
| **Procurement** | Suppliers, purchase orders (approve/receive), vendor invoices |
| **Sales** | Customers, sales orders (fulfill), invoices, shipments |
| **Batches & serials** | Batch tracking, expiry dates, serial number registry |
| **Audits** | Inventory audits with variance reconciliation |
| **Alerts & email** | Low-stock / critical alerts, in-app inbox, Resend email delivery |
| **Analytics** | Dashboard KPIs (overflow-safe stat cards), revenue charts, demand forecasting |
| **AI assistant** | Natural-language queries, dead-stock insights, reorder suggestions |
| **Import / export** | CSV import for products & inventory; report exports |
| **Legacy orders** | Original order/payment/shipment flows retained for compatibility |

### Role-based access

| Role | Typical use |
|------|-------------|
| `super_admin` / `admin` | Full access to all modules |
| `inventory_manager` | Products, POs, audits, suppliers, warehouses |
| `warehouse_staff` | Stock adjustments, transfers, receive POs, fulfill sales |
| `sales_executive` | Customers, sales orders, read inventory |
| `viewer` | Read-only across dashboards and lists |

### Enterprise highlights

- **Single stock write path** — all quantity changes go through `StockMovementService`
- **Structured DRY backend** — domain-split models, thin routers, centralized services
- **Server-side list APIs** — search, sort, and pagination handled in FastAPI (not in the browser)
- **Consistent table UX** — search + sort toolbar above tables, shared rows-per-page control
- **Detail pages** — products, suppliers, warehouses, purchase orders, sales orders
- **Seed script** — demo users, 20 products, 3 warehouses, POs, SOs, batches, audits
- **Enterprise UI** — grouped sidebar nav, navy shell, filter cards, toast notifications

> **Not included:** ERP / e-commerce API integrations (Shopify, SAP, etc.)

---

## List views: search, sort & pagination

All major list screens load data from the **backend** with query parameters. The frontend does not filter or sort full datasets in memory.

### Paginated response shape

List endpoints return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 10,
  "pages": 1
}
```

| Query param | Description |
|-------------|-------------|
| `search` | Free-text filter (fields vary by endpoint; supports `#` prefix and zero-padded IDs where applicable) |
| `sort` | Sort field/key (see table below) |
| `page` | Page number (1-based) |
| `page_size` | Rows per page (`0` = return all — used for dropdowns and exports) |

### Backend list endpoints

| Endpoint | Search fields | Sort options | Default sort |
|----------|---------------|--------------|--------------|
| `GET /products` | ID, name, SKU, description | `name`, `price`, `quantity` | `name` |
| `GET /inventory` | ID, product, SKU, category, location, qty | `name`, `quantity`, `location` | `id` |
| `GET /orders` | Order #, customer, status, product, notes | `newest`, `oldest`, `customer` | `newest` |
| `GET /purchases` | PO #, supplier, status | `newest`, `oldest`, `supplier` | `newest` |
| `GET /sales/orders` | SO #, customer, status | `newest`, `oldest`, `customer` | `newest` |
| `GET /suppliers` | Name, contact, email, phone | `name`, `rating`, `newest` | `name` |
| `GET /warehouses` | Code, name, address | `name`, `code` | `name` |

**Examples:**

```http
GET /products?search=000042&sort=quantity&page=1&page_size=25
GET /orders?status=pending&search=acme&sort=newest&page=2&page_size=10
GET /purchases?search=approved&sort=supplier&page=1&page_size=50
```

### Frontend patterns

| Piece | Location | Role |
|-------|----------|------|
| `PageSizeContext` | `frontend/src/context/PageSizeContext.tsx` | Shared rows-per-page (10 / 25 / 50 / 100), persisted in `localStorage` |
| `Pagination` | `frontend/src/components/index.tsx` | Page controls + rows-per-page dropdown |
| `useDebouncedValue` | `frontend/src/hooks/useDebouncedValue.ts` | 300ms debounce on search inputs |
| `useResetPageOnFilterChange` | `frontend/src/hooks/useResetPageOnFilterChange.ts` | Resets to page 1 when search, sort, filters, or page size change |
| React Query `keepPreviousData` | List hooks | Smooth loading while paginating |

**Pages using server-side lists:** Listings, Inventory, Orders, Payments, Shipments, Reports, Purchases, Sales Orders, Suppliers, Warehouses.

**UI layout:** Search and sort controls sit in a **toolbar above the table** (left-aligned), not inside column headers.

### Date filters (Reports / Orders)

Report and order date ranges use **inclusive** end dates (through end of day). Invalid ranges (start after end) are ignored server-side and surfaced in the UI.

---

## Tech Stack

<table>
<tr><th>Frontend</th><th>Purpose</th></tr>
<tr><td><b>React 19</b></td><td>UI component library</td></tr>
<tr><td><b>TypeScript 6</b></td><td>Static typing</td></tr>
<tr><td><b>Vite 8</b></td><td>Dev server and production bundler</td></tr>
<tr><td><b>Tailwind CSS 4</b></td><td>Utility-first styling</td></tr>
<tr><td><b>React Router 7</b></td><td>Routing and protected routes</td></tr>
<tr><td><b>TanStack React Query 5</b></td><td>Server state, caching, mutations</td></tr>
<tr><td><b>Axios 1.18</b></td><td>HTTP client</td></tr>
<tr><td><b>Recharts 3</b></td><td>Dashboard charts</td></tr>
<tr><td><b>Lucide React</b></td><td>Icons</td></tr>
</table>

<table>
<tr><th>Backend</th><th>Purpose</th></tr>
<tr><td><b>FastAPI 0.115+</b></td><td>REST API framework</td></tr>
<tr><td><b>Uvicorn</b></td><td>ASGI server</td></tr>
<tr><td><b>SQLAlchemy 2</b></td><td>ORM — domain-split models</td></tr>
<tr><td><b>Alembic 1.14+</b></td><td>Database migrations</td></tr>
<tr><td><b>PostgreSQL</b></td><td>Primary database</td></tr>
<tr><td><b>python-jose</b></td><td>JWT tokens</td></tr>
<tr><td><b>bcrypt 4</b></td><td>Password hashing</td></tr>
<tr><td><b>httpx</b></td><td>Resend email API client</td></tr>
<tr><td><b>google-auth</b></td><td>Optional Google OAuth</td></tr>
<tr><td><b>Pydantic Settings 2</b></td><td>Environment config</td></tr>
</table>

---

## Application Flows

### System architecture

```mermaid
flowchart LR
    subgraph Client["Browser :5173"]
        UI[React SPA]
        RQ[React Query]
        AX[Axios + JWT]
    end

    subgraph Server["FastAPI :8000"]
        RT[Routers]
        SV[Services]
        AU[Auth / RBAC]
        RS[Resend Email]
    end

    subgraph Data["PostgreSQL"]
        DB[(inventory_db)]
    end

    UI --> RQ --> AX
    AX -->|REST JSON| RT
    RT --> AU
    RT --> SV
    SV -->|SQLAlchemy| DB
    SV --> RS
```

---

### Authentication flow

```mermaid
sequenceDiagram
    actor U as User
    participant L as Login Page
    participant A as FastAPI /auth
    participant D as PostgreSQL

    U->>L: Email/password OR quick demo role
    L->>A: POST /auth/login
    A->>D: Verify credentials
    D-->>A: User record + role
    A-->>L: JWT access_token
    L-->>U: Redirect to dashboard

    Note over U,A: Subsequent requests
    U->>A: API call + Bearer JWT
    A->>A: Validate token + require_permission()
    A-->>U: JSON response
```

On the login page, **Quick demo login** shows role buttons (Admin, Manager, Warehouse, Sales, Viewer). Hover a role to see what it can do; click to sign in instantly. Credentials are not shown in the UI — use the table below or manual email/password login.

---

### Stock movement (single write path)

```mermaid
flowchart TD
    A[Adjust / Receive / Fulfill / Transfer] --> B[StockMovementService]
    B --> C[stock_movements ledger]
    B --> D[inventory_balances per warehouse]
    B --> E[Legacy inventory sync]
    E --> F{qty < threshold?}
    F -->|Yes| G[Create alert]
    G --> H[In-app notifications]
    G --> I[Resend email optional]
```

---

### Order lifecycle (legacy)

```mermaid
stateDiagram-v2
    [*] --> Pending: Admin creates order
    Pending --> Received: Mark received / New shipment
    Pending --> Cancelled: Cancel order
    Received --> [*]
    Cancelled --> [*]
```

---

### Inventory & alerts

```mermaid
flowchart TD
    A[Create / edit product] --> B[Inventory record]
    B --> C{qty < threshold?}
    C -->|Yes| D[Create stock alert]
    C -->|No| E[No new alert]
    D --> F[Notifications page]
    D --> G[Resend email]
    B --> H[StockMovementService.adjust]
    H --> B
    H --> C
    F --> I[Mark as read]
```

---

### App navigation map

| Route | Page |
|-------|------|
| `/dashboard` | KPI overview + charts |
| `/listings`, `/listings/:id` | Product catalog + detail |
| `/inventory` | Stock levels, quick adjust |
| `/warehouses`, `/warehouses/:id` | Multi-warehouse management |
| `/suppliers`, `/suppliers/:id` | Vendor directory + detail |
| `/purchases`, `/purchases/:id` | Purchase orders + approve/receive |
| `/sales`, `/sales/:id` | Sales orders + fulfill |
| `/orders`, `/orders/:id` | Legacy orders |
| `/payments`, `/shipments` | Payment & shipment views |
| `/reports` | Analytics + CSV export |
| `/notifications` | Alert inbox |
| `/ai-assistant` | Smart inventory assistant |
| `/activity-logs` | Audit trail of user actions |

---

## Architecture

```
┌─────────────┐     HTTP/JSON      ┌──────────────────┐     SQL       ┌──────────────┐
│   Browser   │ ◄──────────────► │  React SPA       │               │              │
│  :5173      │                   │  Vite + React     │               │  PostgreSQL  │
└─────────────┘                   │  React Query      │               │  inventory_db│
                                  │  Axios + JWT      │               └──────▲───────┘
                                  └────────┬─────────┘                      │
                                           │ REST :8000                     │
                                           ▼                                │
                                  ┌──────────────────┐     SQLAlchemy       │
                                  │  FastAPI         │ ◄────────────────────┘
                                  │  Routers · RBAC  │
                                  │  Services        │──────► Resend (email)
                                  └──────────────────┘
```

**Request lifecycle:** User action → React component → React Query hook → Axios (JWT) → FastAPI router → `require_permission()` → Service layer → PostgreSQL → JSON → UI update.

**Backend layers:**

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routers | `app/routers/` | HTTP endpoints, validation, auth deps |
| Services | `app/services/` | Business logic (stock, orders, alerts, AI, import) |
| Models | `app/models/` | SQLAlchemy ORM — split by domain |
| Schemas | `app/schemas/` | Pydantic request/response types |
| Core | `app/core/` | Config, JWT, permissions, dependencies |

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Python | 3.11+ |
| PostgreSQL | 14+ |
| npm | 9+ |

### Quick start

```bash
# 1. Database
createdb inventory_db

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set DATABASE_URL and optionally RESEND_API_KEY
alembic upgrade head && python seed.py
./run.sh

# 3. Frontend (new terminal)
cd frontend
npm install && cp .env.example .env
npm run dev
```

| Service | URL |
|---------|-----|
| **App** | http://localhost:5173 |
| **API** | http://localhost:8000 |
| **Swagger docs** | http://localhost:8000/docs |

### Demo credentials

All five accounts are created by `seed.py` (upserted by email if missing). You can sign in manually or use **Quick demo login** on the login page.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@inventory.com` | `admin123` |
| Inventory Manager | `manager@inventory.com` | `manager123` |
| Warehouse Staff | `warehouse@inventory.com` | `warehouse123` |
| Sales Executive | `sales@inventory.com` | `sales123` |
| Viewer | `viewer@inventory.com` | `viewer123` |

### Environment variables

<details>
<summary><b>backend/.env.example</b></summary>

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
SECRET_KEY=change-me-to-a-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173

# Resend email notifications (optional — in-app alerts work without this)
# 1. Sign up at https://resend.com and create an API key
# 2. Use onboarding@resend.dev as sender until you verify your own domain
# 3. On free tier, emails can only go to your Resend account email
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Ventorio <onboarding@resend.dev>
ALERT_EMAIL_RECIPIENTS=you@example.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
```

</details>

<details>
<summary><b>frontend/.env.example</b></summary>

```env
VITE_API_URL=http://localhost:8000
```

</details>

### Re-seed demo data

```bash
cd backend && ./venv/bin/python seed.py
```

The seed script fills empty tables and upserts missing demo users. Safe to re-run.

### Email alerts (Resend)

Low-stock alerts appear in **Notifications** in the app. To also send email:

1. Add `RESEND_API_KEY` to `backend/.env` (get it from [resend.com](https://resend.com))
2. Set `RESEND_FROM_EMAIL=Ventorio <onboarding@resend.dev>` (use your verified domain later)
3. Set `ALERT_EMAIL_RECIPIENTS` to the email(s) that should receive alerts
4. On Resend's free/testing tier, emails can only be sent to **your Resend account email** until you verify a domain
5. Restart the backend, open **Notifications**, and click **Send test email** to verify

**How it works:** when stock drops below threshold, `StockMovementService` → `alert_service` creates an in-app alert → `notification_service` sends email via Resend API to `ALERT_EMAIL_RECIPIENTS` (or admin/manager users if unset).

---

## API Reference

> **Auth legend:** `No` = public · `Yes` = any logged-in user with read permission · `Write` = role with write permission for that resource (see RBAC)

Full interactive docs: **http://localhost:8000/docs**

<details>
<summary><b>Auth & health</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | No |
| `POST` | `/auth/register` | Register user | Admin |
| `POST` | `/auth/login` | Login → JWT | No |
| `GET` | `/auth/me` | Current user | Yes |

</details>

<details>
<summary><b>Categories & products</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/categories` | List categories | Yes |
| `POST` | `/categories` | Create category | Write |
| `PATCH` | `/categories/{id}` | Update category | Write |
| `DELETE` | `/categories/{id}` | Delete category | Write |
| `GET` | `/products` | Paginated products (`?search=&sort=name\|price\|quantity&page=&page_size=`) | Yes |
| `GET` | `/products/{id}` | Get product + variants | Yes |
| `POST` | `/products` | Create product | Write |
| `PATCH` | `/products/{id}` | Update product | Write |
| `DELETE` | `/products/{id}` | Delete product | Write |

</details>

<details>
<summary><b>Inventory & warehouses</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/inventory` | Paginated inventory (`?search=&sort=name\|quantity\|location&page=&page_size=`) | Yes |
| `GET` | `/inventory/low-stock` | Low-stock items | Yes |
| `POST` | `/inventory/{id}/adjust` | Adjust quantity | Write |
| `GET` | `/warehouses` | Paginated warehouses (`?search=&sort=name\|code&page=&page_size=`) | Yes |
| `GET` | `/warehouses/{id}` | Warehouse detail + balances | Yes |
| `POST` | `/warehouses/transfers` | Inter-warehouse transfer | Write |
| `GET` | `/warehouses/transfers` | List transfers | Yes |

</details>

<details>
<summary><b>Suppliers & procurement</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/suppliers` | Paginated suppliers (`?search=&sort=name\|rating\|newest&page=&page_size=`) | Yes |
| `GET` | `/suppliers/{id}` | Supplier detail | Yes |
| `POST` | `/suppliers` | Create supplier | Write |
| `GET` | `/purchases` | Paginated POs (`?search=&sort=newest\|oldest\|supplier&page=&page_size=`) | Yes |
| `GET` | `/purchases/{id}` | PO detail + line items | Yes |
| `POST` | `/purchases` | Create PO | Write |
| `POST` | `/purchases/{id}/approve` | Approve PO | Write |
| `POST` | `/purchases/{id}/receive` | Receive stock | Write |

</details>

<details>
<summary><b>Sales & customers</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/sales/customers` | List customers | Yes |
| `POST` | `/sales/customers` | Create customer | Write |
| `GET` | `/sales/orders` | Paginated sales orders (`?search=&sort=newest\|oldest\|customer&page=&page_size=`) | Yes |
| `GET` | `/sales/orders/{id}` | SO detail | Yes |
| `POST` | `/sales/orders` | Create sales order | Write |
| `POST` | `/sales/orders/{id}/fulfill` | Fulfill + deduct stock | Write |

</details>

<details>
<summary><b>Batches, audits, AI, import/export</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/batches` | List batches | Yes |
| `POST` | `/batches` | Create batch | Write |
| `GET` | `/audits` | List inventory audits | Yes |
| `POST` | `/audits` | Start audit | Write |
| `POST` | `/audits/{id}/complete` | Complete + reconcile | Write |
| `POST` | `/ai/chat` | AI assistant query | Yes |
| `GET` | `/ai/forecast` | Demand forecast | Yes |
| `POST` | `/import-export/products` | Import products CSV | Write |
| `GET` | `/import-export/inventory` | Export inventory CSV | Yes |

</details>

<details>
<summary><b>Orders, reports, alerts (legacy + shared)</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/orders` | Paginated legacy orders (`?status=&search=&sort=newest\|oldest\|customer&start_date=&end_date=&page=&page_size=`) | Yes |
| `POST` | `/orders` | Create order | Write |
| `GET` | `/reports/summary` | Dashboard stats | Yes |
| `GET` | `/reports/export` | Inventory CSV | Yes |
| `GET` | `/alerts` | List alerts | Yes |
| `PATCH` | `/alerts/{id}/read` | Mark read | Yes |
| `GET` | `/notifications/email-config` | Email provider status | Yes |
| `POST` | `/notifications/test-email` | Send test alert email | Yes |

</details>

---

## Database Schema

The v2 schema adds **30+ tables** across domains. Core relationships:

```mermaid
erDiagram
    categories ||--o{ products : has
    products ||--o{ product_variants : has
    products ||--o{ inventory_balances : stocked_at
    warehouses ||--o{ inventory_balances : holds
    products ||--o{ stock_movements : tracked_by
    suppliers ||--o{ purchase_orders : issues
    purchase_orders ||--o{ purchase_order_items : contains
    customers ||--o{ sales_orders : places
    sales_orders ||--o{ sales_order_items : contains
    products ||--o{ batches : batched
    warehouses ||--o{ warehouse_transfers : from_to
    users ||--o{ activity_logs : performs
```

| Domain | Tables |
|--------|--------|
| **Catalog** | `categories`, `products`, `product_variants`, `barcodes` |
| **Inventory** | `inventory`, `inventory_balances`, `stock_movements`, `warehouses`, `warehouse_transfers` |
| **Procurement** | `suppliers`, `purchase_orders`, `purchase_order_items`, `vendor_invoices` |
| **Sales** | `customers`, `sales_orders`, `sales_order_items`, `invoices` |
| **Tracking** | `batches`, `serial_numbers`, `inventory_audits`, `audit_items` |
| **System** | `users`, `alerts`, `notifications`, `activity_logs`, `login_history` |
| **Legacy** | `orders`, `order_items` |

Migrations: `alembic/versions/001_initial.py` → `002_enterprise_features.py`

---

## Project Structure

```
inventory/
├── README.md
├── backend/
│   ├── alembic/versions/      # 001_initial, 002_enterprise_features
│   ├── app/
│   │   ├── main.py            # FastAPI entry — all routers registered
│   │   ├── core/              # config, deps, permissions, security
│   │   ├── models/            # Domain-split SQLAlchemy models
│   │   ├── schemas/           # Pydantic request/response types
│   │   ├── routers/           # auth, products, inventory, warehouses,
│   │   │                      # suppliers, purchases, sales, batches,
│   │   │                      # audits, ai, import_export, …
│   │   ├── utils/             # pagination, date_range helpers
│   │   └── services/          # stock_movement, notification, alert,
│   │                          # audit, forecast, ai, order, import_export
│   ├── requirements.txt
│   ├── run.sh
│   └── seed.py                # Comprehensive demo data + user upsert
└── frontend/
    └── src/
        ├── api/                 # Axios clients (orders, products, enterprise, …)
        ├── components/          # Layout, Table, Pagination, StatCard, …
        ├── context/             # Auth, toast, PageSize
        ├── hooks/               # React Query hooks + useDebouncedValue,
        │                        # useResetPageOnFilterChange, usePagination
        ├── pages/               # All route pages + detail views
        └── types/               # TypeScript interfaces
```

---

## Contributing

### Branch naming

| Prefix | Example |
|--------|---------|
| `feature/` | `feature/barcode-scanner` |
| `fix/` | `fix/po-receive-stock` |
| `refactor/` | `refactor/stock-service` |

### Pull request checklist

- [ ] Branch created from `main`
- [ ] Backend runs (`./run.sh`)
- [ ] Migrations applied (`alembic upgrade head`)
- [ ] Frontend builds (`npm run build`)
- [ ] PR describes what and why
- [ ] README updated if architecture or API changed
