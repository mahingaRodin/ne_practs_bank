# XWZ LTD — Parking Management System

Microservices-based car parking management system for XWZ LTD (Kigali, Rwanda).

## Project Structure

```
restful_ne_pract/
├── docs/                  # Requirements, DB design, architecture, Figma specs
├── backend/               # Node.js microservices
│   ├── api-gateway/       # Port 3000 — single entry point + Swagger
│   ├── auth-service/      # Port 3001 — registration, login, JWT
│   ├── parking-service/   # Port 3002 — parking CRUD
│   ├── entry-service/     # Port 3003 — car entry/exit, tickets, bills
│   ├── report-service/    # Port 3004 — date-range reports
│   └── shared/            # Prisma schema, JWT, logger, helpers
└── frontend/              # React + Vite + Tailwind (port 5173)
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd restful_ne_pract/backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

This starts all 5 microservices concurrently.

### 2. Frontend Setup

```bash
cd restful_ne_pract/frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### 3. Swagger API Docs

**http://localhost:3000/api-docs**

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@xwz.rw | Admin@123 |
| Parking Attendant | attendant@xwz.rw | Attendant@123 |

## Features Checklist

| Task | Feature | Status |
|------|---------|--------|
| 1 | Database model design | ✅ `docs/DATABASE_DESIGN.md` |
| 1 | System architecture | ✅ `docs/ARCHITECTURE.md` |
| 1 | Signup Figma mockup specs | ✅ `docs/FIGMA_MOCKUP.md` + React UI |
| 2 | User roles (admin, attendant) | ✅ |
| 2 | User registration | ✅ |
| 2 | JWT authentication | ✅ |
| 2 | Login for admin & attendants | ✅ |
| 3 | Register parking | ✅ |
| 3 | View available parkings | ✅ |
| 4 | Car entry (exit=null, charge=0) | ✅ |
| 4 | Ticket on entry | ✅ |
| 4 | Bill on exit | ✅ |
| 4 | Update vacant spaces | ✅ |
| 5 | Outgoing report with total charged | ✅ |
| 5 | Entered cars report | ✅ |

## Other Requirements

- ✅ Software requirements document
- ✅ React.js frontend with forms
- ✅ Node.js microservices backend
- ✅ SQLite database (Prisma ORM)
- ✅ Swagger UI documentation
- ✅ JWT authentication & authorization
- ✅ Pagination on all list views
- ✅ Winston logging
- ✅ Validation & exception handling
- ✅ CORS, Helmet, rate limiting
- ✅ Responsive UI

## API Gateway Routes

All requests go through `http://localhost:3000`:

- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET /api/auth/users` — List users (admin)
- `POST /api/parkings` — Register parking (admin)
- `GET /api/parkings` — List parkings
- `POST /api/entries` — Car entry + ticket
- `POST /api/entries/exit` — Car exit + bill
- `GET /api/reports/outgoing?startDate=&endDate=` — Outgoing report
- `GET /api/reports/entered?startDate=&endDate=` — Entered report
