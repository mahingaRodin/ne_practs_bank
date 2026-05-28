# XWZ LTD Parking Management System — Software Requirements

## 1. Problem Statement

XWZ LTD manages parking in Kigali and other areas in Rwanda. The legacy monolithic system must be replaced with a **microservices architecture** enabling independent scaling, deployment, and real-time reporting.

## 2. Functional Requirements

### FR-1: User Management (Task 1 & 2)
| ID | Requirement |
|----|-------------|
| FR-1.1 | Users register with: id, firstName, lastName, email, password |
| FR-1.2 | Roles: **admin**, **parking_attendant** |
| FR-1.3 | JWT-based authentication for signup and login |
| FR-1.4 | Admin and parking attendants can log in after signup |

### FR-2: Parking Management (Task 3)
| ID | Requirement |
|----|-------------|
| FR-2.1 | Admin registers parking: code, name, available spaces, location, fee per hour |
| FR-2.2 | Parking attendants view available parkings, spaces, and fees |

### FR-3: Car Entry & Exit (Task 4)
| ID | Requirement |
|----|-------------|
| FR-3.1 | Register car entry: id, plate number, parking code, entry datetime |
| FR-3.2 | exitDateTime defaults to null; chargedAmount defaults to 0 |
| FR-3.3 | Generate ticket on entry |
| FR-3.4 | On exit: update exit datetime, calculate bill (duration × fee), generate bill |
| FR-3.5 | Decrement/increment available spaces on entry/exit |

### FR-4: Reporting (Task 5)
| ID | Requirement |
|----|-------------|
| FR-4.1 | Report outgoing cars with total charged amount between two datetimes |
| FR-4.2 | Report all entered cars between two datetimes |

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Microservices architecture with API Gateway |
| NFR-2 | Swagger UI API documentation |
| NFR-3 | Pagination on all list endpoints |
| NFR-4 | Structured logging (Winston) |
| NFR-5 | Input validation and global exception handling |
| NFR-6 | CORS, Helmet, rate limiting for web security |
| NFR-7 | Responsive React frontend |
| NFR-8 | Figma mockup for user registration/signup form |

## 4. Data Flow

```
[React Frontend]
       │
       ▼
[API Gateway :3000] ── JWT verify ──┐
       │                             │
       ├──► Auth Service :3001       │
       ├──► Parking Service :3002   │
       ├──► Entry Service :3003     │
       └──► Report Service :3004    │
                                     ▼
                            [SQLite Database]
```

### Registration Flow
1. User submits signup form → Auth Service validates → hash password → save user → return JWT

### Login Flow
1. User submits credentials → Auth Service verifies → return JWT + role

### Car Entry Flow
1. Attendant selects parking → Entry Service checks availability → creates entry (exit=null, charge=0) → generates ticket → decrements spaces

### Car Exit Flow
1. Attendant enters plate/ticket → Entry Service finds active entry → calculates hours × fee → updates exit & charge → generates bill → increments spaces

## 5. UI Forms / Pages

| Form / Page | Role | Purpose |
|-------------|------|---------|
| Signup | Public | User registration (Figma mockup) |
| Login | Public | Authentication |
| Dashboard | All | Role-based navigation |
| Register Parking | Admin | Create parking lot |
| Parking List | Attendant, Admin | View available parkings (paginated) |
| Car Entry | Attendant | Register incoming car |
| Car Exit | Attendant | Process outgoing car, show bill |
| Outgoing Report | Admin | Filter by date range, paginated |
| Entered Cars Report | Admin | Filter by date range, paginated |
| Users List | Admin | View registered users (paginated) |

## 6. API Endpoints Summary

| Service | Method | Endpoint | Auth |
|---------|--------|----------|------|
| Auth | POST | /api/auth/register | Public |
| Auth | POST | /api/auth/login | Public |
| Auth | GET | /api/auth/users | Admin |
| Parking | POST | /api/parkings | Admin |
| Parking | GET | /api/parkings | Attendant, Admin |
| Parking | GET | /api/parkings/:code | Attendant, Admin |
| Entry | POST | /api/entries | Attendant |
| Entry | POST | /api/entries/:id/exit | Attendant |
| Entry | GET | /api/entries | Attendant, Admin |
| Report | GET | /api/reports/outgoing | Admin |
| Report | GET | /api/reports/entered | Admin |
