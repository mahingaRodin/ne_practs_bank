# Database Design — XWZ Parking Management System

## ER Diagram (Conceptual)

```
┌─────────────────┐         ┌──────────────────┐
│     User        │         │     Parking      │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ firstName       │         │ code (UNIQUE)    │
│ lastName        │         │ name             │
│ email (UNIQUE)  │         │ totalSpaces      │
│ password        │         │ availableSpaces  │
│ role            │         │ location         │
│ createdAt       │         │ feePerHour       │
│ updatedAt       │         │ createdAt        │
└─────────────────┘         │ updatedAt        │
                            └────────┬─────────┘
                                     │ 1
                                     │
                                     │ N
                            ┌────────▼─────────┐
                            │   CarEntry       │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ plateNumber      │
                            │ parkingCode (FK) │
                            │ entryDateTime    │
                            │ exitDateTime     │
                            │ chargedAmount    │
                            │ ticketNumber     │
                            │ createdAt        │
                            │ updatedAt        │
                            └──────────────────┘
```

## Tables

### User
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | User identifier |
| firstName | TEXT | NOT NULL | First name |
| lastName | TEXT | NOT NULL | Last name |
| email | TEXT | UNIQUE, NOT NULL | Login email |
| password | TEXT | NOT NULL | Bcrypt hash |
| role | TEXT | NOT NULL, DEFAULT 'parking_attendant' | `admin` or `parking_attendant` |
| createdAt | DATETIME | DEFAULT now | Record creation |
| updatedAt | DATETIME | AUTO UPDATE | Last modification |

### Parking
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Parking identifier |
| code | TEXT | UNIQUE, NOT NULL | Short code e.g. KGL-01 |
| name | TEXT | NOT NULL | Parking name |
| totalSpaces | INTEGER | NOT NULL | Total capacity |
| availableSpaces | INTEGER | NOT NULL | Current vacant spaces |
| location | TEXT | NOT NULL | Physical location |
| feePerHour | REAL | NOT NULL | Charging fee (RWF) |
| createdAt | DATETIME | DEFAULT now | Record creation |
| updatedAt | DATETIME | AUTO UPDATE | Last modification |

### CarEntry
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Entry identifier |
| plateNumber | TEXT | NOT NULL | Vehicle plate |
| parkingCode | TEXT | FK → Parking.code | Parking reference |
| entryDateTime | DATETIME | NOT NULL | Entry timestamp |
| exitDateTime | DATETIME | NULL | Exit timestamp (null while parked) |
| chargedAmount | REAL | DEFAULT 0 | Total fee charged |
| ticketNumber | TEXT | UNIQUE, NOT NULL | Generated ticket ID |
| createdAt | DATETIME | DEFAULT now | Record creation |
| updatedAt | DATETIME | AUTO UPDATE | Last modification |

## Business Rules

1. **availableSpaces** ≤ **totalSpaces** at all times.
2. Car entry rejected when **availableSpaces = 0**.
3. Only one active entry (exitDateTime = null) per plate per parking at a time.
4. **chargedAmount** = ceil(hours parked) × **feePerHour** (minimum 1 hour).
5. On entry: `availableSpaces -= 1`; on exit: `availableSpaces += 1`.

## Indexes

- `User.email` — unique lookup for login
- `Parking.code` — unique lookup for entry/exit
- `CarEntry.parkingCode` — report filtering
- `CarEntry.entryDateTime`, `CarEntry.exitDateTime` — date-range reports
- `CarEntry.ticketNumber` — ticket lookup
