# System Architecture — XWZ Parking Management System

## Overview

The system follows a **microservices architecture** with an API Gateway as the single entry point for the React frontend.

```
                    ┌─────────────────────────────────────┐
                    │         React Frontend (Vite)        │
                    │              :5173                   │
                    └──────────────────┬──────────────────┘
                                       │ HTTPS/HTTP
                                       ▼
                    ┌─────────────────────────────────────┐
                    │         API Gateway (:3000)          │
                    │  • CORS, Helmet, Rate Limiting       │
                    │  • JWT verification (protected)      │
                    │  • Request routing & logging         │
                    │  • Aggregated Swagger UI             │
                    └──────┬──────┬──────┬──────┬─────────┘
                           │      │      │      │
              ┌────────────┘      │      │      └────────────┐
              ▼                   ▼      ▼                   ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Auth Service   │ │   Parking    │ │    Entry     │ │   Report     │
    │     :3001       │ │   Service    │ │   Service    │ │   Service    │
    │                 │ │    :3002     │ │    :3003     │ │    :3004     │
    │ • Register      │ │ • CRUD       │ │ • Entry      │ │ • Outgoing   │
    │ • Login         │ │   parking    │ │ • Exit       │ │   report     │
    │ • User list     │ │ • List/view  │ │ • Ticket     │ │ • Entered    │
    │ • JWT issue     │ │              │ │ • Bill       │ │   report     │
    └────────┬────────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                 │                │                │
             └─────────────────┴────────────────┴────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │   SQLite (Prisma)    │
                            │   parking.db         │
                            └─────────────────────┘
```

## Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| **API Gateway** | 3000 | Single entry, security middleware, proxy to services |
| **Auth Service** | 3001 | User registration, login, JWT, role management |
| **Parking Service** | 3002 | Parking lot registration and availability |
| **Entry Service** | 3003 | Car entry/exit, tickets, billing, space updates |
| **Report Service** | 3004 | Date-range reports with pagination |

## Shared Package

`backend/shared` contains:
- Prisma schema and client
- JWT utilities
- Logger (Winston)
- Error classes and validation helpers

## Security

| Layer | Mechanism |
|-------|-----------|
| Transport | CORS whitelist (frontend origin) |
| Headers | Helmet (XSS, clickjacking, etc.) |
| Auth | JWT Bearer tokens, role-based access |
| Input | express-validator on all endpoints |
| Rate | express-rate-limit on gateway |
| Password | bcrypt (12 rounds) |

## Communication

- **Synchronous**: HTTP/REST between gateway and services
- **Database**: Shared SQLite via Prisma (acceptable for exam; production would use per-service DBs with events)

## Deployment

```bash
# Backend (from backend/)
npm install
npm run db:push
npm run seed
npm run dev          # starts all services via concurrently

# Frontend (from frontend/)
npm install
npm run dev
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express 4 |
| ORM | Prisma 5 |
| Database | SQLite |
| Auth | jsonwebtoken, bcryptjs |
| Docs | swagger-jsdoc, swagger-ui-express |
| Logging | Winston |
| Validation | express-validator |
