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
![License](https://img.shields.io/badge/License-MIT-green)

[Features](#features) · [Flows](#application-flows) · [Getting Started](#getting-started) · [API](#api-reference) · [Schema](#database-schema) · [Screenshots](#screenshots)

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
- [Tech Stack](#tech-stack)
- [Application Flows](#application-flows)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Module overview

![Ventorio Modules](docs/diagrams/modules-overview.svg)

### Core modules

| Module | Capabilities |
|--------|-------------|
| **Auth & RBAC** | JWT login/register, 6 roles, permission matrix, activity & login logs |
| **Product catalog** | SKU, variants, barcodes, subcategories, product detail pages |
| **Inventory & WMS** | Multi-warehouse balances, stock movements ledger, transfers, cycle counts |
| **Procurement** | Suppliers, purchase orders (approve/receive), vendor invoices |
| **Sales** | Customers, sales orders (fulfill), invoices, shipments |
| **Batches & serials** | Batch tracking, expiry dates, serial number registry |
| **Audits** | Inventory audits with variance reconciliation |
| **Alerts & email** | Low-stock / critical alerts, in-app inbox, Resend email delivery |
| **Analytics** | Dashboard KPIs, revenue charts, demand forecasting |
| **AI assistant** | Natural-language queries, dead-stock insights, reorder suggestions |
| **Import / export** | CSV import for products & inventory; report exports |
| **Legacy orders** | Original order/payment/shipment flows retained for compatibility |

### Role-based access

![RBAC Roles](docs/diagrams/rbac-roles.svg)

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
- **Detail pages** — products, suppliers, warehouses, purchase orders, sales orders
- **Seed script** — demo users, 20 products, 3 warehouses, POs, SOs, batches, audits
- **Enterprise UI** — grouped sidebar nav, navy shell, filter cards, toast notifications

> **Not included:** ERP / e-commerce API integrations (Shopify, SAP, etc.)

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

Visual flow diagrams live in [`docs/diagrams/`](docs/diagrams/). They render inline on GitHub.

### System architecture

![System Architecture](docs/diagrams/architecture.svg)

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

![Authentication Flow](docs/diagrams/auth-flow.svg)

```mermaid
sequenceDiagram
    actor U as User
    participant L as Login Page
    participant A as FastAPI /auth
    participant D as PostgreSQL

    U->>L: Enter email + password
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

![Order Lifecycle](docs/diagrams/order-flow.svg)

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

![Inventory Flow](docs/diagrams/inventory-flow.svg)

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

![App Navigation](docs/diagrams/app-navigation.svg)

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

All five accounts are created by `seed.py` (upserted by email if missing):

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

# Resend email notifications (optional — alerts still work in-app without this)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Ventorio <alerts@yourdomain.com>
ALERT_EMAIL_RECIPIENTS=admin@inventory.com

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
| `GET` | `/products` | List products (`?search=`) | Yes |
| `GET` | `/products/{id}` | Get product + variants | Yes |
| `POST` | `/products` | Create product | Write |
| `PATCH` | `/products/{id}` | Update product | Write |
| `DELETE` | `/products/{id}` | Delete product | Write |

</details>

<details>
<summary><b>Inventory & warehouses</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/inventory` | List inventory | Yes |
| `GET` | `/inventory/low-stock` | Low-stock items | Yes |
| `POST` | `/inventory/{id}/adjust` | Adjust quantity | Write |
| `GET` | `/warehouses` | List warehouses | Yes |
| `GET` | `/warehouses/{id}` | Warehouse detail + balances | Yes |
| `POST` | `/warehouses/transfers` | Inter-warehouse transfer | Write |
| `GET` | `/warehouses/transfers` | List transfers | Yes |

</details>

<details>
<summary><b>Suppliers & procurement</b></summary>

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/suppliers` | List suppliers | Yes |
| `GET` | `/suppliers/{id}` | Supplier detail | Yes |
| `POST` | `/suppliers` | Create supplier | Write |
| `GET` | `/purchases` | List purchase orders | Yes |
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
| `GET` | `/sales/orders` | List sales orders | Yes |
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
| `GET` | `/orders` | List legacy orders | Yes |
| `POST` | `/orders` | Create order | Write |
| `GET` | `/reports/summary` | Dashboard stats | Yes |
| `GET` | `/reports/export` | Inventory CSV | Yes |
| `GET` | `/alerts` | List alerts | Yes |
| `PATCH` | `/alerts/{id}/read` | Mark read | Yes |

</details>

---

## Database Schema

![ER Diagram (core tables)](docs/diagrams/er-diagram.svg)

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

## Screenshots

UI mockups below are SVG illustrations. Replace with real PNG captures — see [`screenshots/README.md`](screenshots/README.md).

<table>
<tr>
<td width="50%">

**Dashboard**

![Dashboard](screenshots/dashboard.svg)

</td>
<td width="50%">

**Purchase Orders**

![Purchases](screenshots/purchases.svg)

</td>
</tr>
<tr>
<td>

**Login (5 demo accounts)**

![Login](screenshots/login.svg)

</td>
<td>

**Navigation & modules**

![Modules](docs/diagrams/modules-overview.svg)

</td>
</tr>
</table>

> To capture real screenshots: start backend (`:8000`) + frontend (`:5173`), then save PNGs to `screenshots/` per the checklist.

---

## Project Structure

```
inventory/
├── README.md
├── docs/
│   └── diagrams/              # SVG flow diagrams
│       ├── architecture.svg
│       ├── auth-flow.svg
│       ├── order-flow.svg
│       ├── inventory-flow.svg
│       ├── app-navigation.svg
│       ├── modules-overview.svg
│       ├── rbac-roles.svg
│       └── er-diagram.svg
├── screenshots/               # UI mockups / PNG captures
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
│   │   └── services/          # stock_movement, notification, alert,
│   │                          # audit, forecast, ai, order, import_export
│   ├── requirements.txt
│   ├── run.sh
│   └── seed.py                # Comprehensive demo data + user upsert
└── frontend/
    └── src/
        ├── api/                 # Axios clients (enterprise.ts, …)
        ├── components/          # Layout, shared UI
        ├── context/             # Auth + toast
        ├── hooks/               # React Query hooks (useEnterprise, …)
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
| `docs/` | `docs/readme-flows` |
| `refactor/` | `refactor/stock-service` |

### Pull request checklist

- [ ] Branch created from `main`
- [ ] Backend runs (`./run.sh`)
- [ ] Migrations applied (`alembic upgrade head`)
- [ ] Frontend builds (`npm run build`)
- [ ] PR describes what and why
- [ ] UI changes include screenshots
- [ ] Flow/schema docs updated if architecture changed

---

## License

MIT License — see [LICENSE](LICENSE) or the notice below.

```
MIT License — Copyright (c) 2026 Ventorio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```
