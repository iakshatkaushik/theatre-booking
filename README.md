# 🎭 CineVerse — Theatre Management System

A **production-ready** full-stack web application for theatre/cinema management, built with Node.js, Express, PostgreSQL, and Prisma ORM. Features real-time seat selection, JWT authentication, concurrency-safe bookings, and a Cinema-themed dark UI.

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| 🎬 Movie Management | CRUD operations for movies with genres, language, duration |
| 🕐 Show Scheduling | Create shows across multiple auditoriums with custom pricing |
| 💺 Interactive Seat Selection | Visual seat map with row-by-row layout and category colors |
| 🔒 Concurrency Control | `SELECT...FOR UPDATE` + UNIQUE constraints to prevent double booking |
| 🔐 JWT Authentication | Secure login/signup with bcrypt password hashing |
| 👤 User Dashboard | View booking history with status tracking |
| ⚙️ Admin Dashboard | Revenue reports, movie/show CRUD, booking management |
| 📊 Revenue Analytics | Filter by date range, revenue by movie breakdown |
| 📝 Audit Logging | All actions logged to database with IP tracking |
| 🛡️ Security | Helmet, CORS, rate limiting, input validation with Zod |
| 🐳 Docker Ready | One-command deployment with docker-compose |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Winston |
| Frontend | HTML5, CSS3, Vanilla JS |
| Deployment | Docker, docker-compose |

---

## 📁 Project Structure

```
DBMS project/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # Seed data
│   ├── src/
│   │   ├── config/index.js      # Environment config
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Auth, error, rate-limit
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Logger, helpers
│   │   └── validations/        # Zod schemas
│   ├── server.js               # Express app entry
│   ├── package.json
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── css/style.css           # Cinema dark theme
│   ├── js/app.js               # API client + UI helpers
│   ├── index.html              # Landing page
│   ├── movies.html             # Movie listing
│   ├── shows.html              # Show times
│   ├── seats.html              # Seat selection
│   ├── checkout.html           # Booking confirmation
│   ├── dashboard.html          # User bookings
│   └── admin.html              # Admin dashboard
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** v18+ (LTS)
- **PostgreSQL** 14+ running locally
- **npm** or **yarn**

### 1. Setup Database

```bash
# Create database and user
psql -U postgres
CREATE DATABASE theatre_db;
CREATE USER theatre_user WITH PASSWORD 'theatre_pass_2025';
GRANT ALL PRIVILEGES ON DATABASE theatre_db TO theatre_user;
\q
```

### 2. Install & Configure

```bash
# Navigate to backend
cd backend

# Copy environment file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Install dependencies
npm install

# Generate Prisma client + run migrations + seed database
npm run setup
```

### 3. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎬

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@theatre.com | Admin@123 |
| User | user@theatre.com | User@123 |

---

## 🐳 Docker Deployment

### One-Command Start

```bash
docker-compose up --build -d
```

This starts PostgreSQL and the app. Then run migrations:

```bash
# Run migrations inside the container
docker-compose exec app npx prisma migrate deploy
docker-compose exec app node prisma/seed.js
```

Visit **http://localhost:3000** 🎬

### Stop

```bash
docker-compose down
# To also delete data:
docker-compose down -v
```

---

## 📡 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/movies` | List movies (search, pagination) |
| GET | `/api/shows` | List shows (filter by date, movie) |
| GET | `/api/shows/:id/seats` | Get seat map for a show |

### Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Book seats (transaction-safe) |
| GET | `/api/bookings/my-bookings` | User's booking history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/movies` | Create movie |
| PUT | `/api/admin/movies/:id` | Update movie |
| DELETE | `/api/admin/movies/:id` | Delete movie |
| POST | `/api/admin/shows` | Create show |
| GET | `/api/admin/bookings` | All bookings |
| PATCH | `/api/admin/bookings/:id/cancel` | Cancel booking |
| GET | `/api/admin/revenue` | Revenue report |

---

## 🔒 Concurrency Control (Double Booking Prevention)

```sql
-- Inside a SERIALIZABLE transaction, we:
1. SELECT seats FOR UPDATE (row-level lock)
2. Check if any seat is already booked for this show
3. If conflict → ROLLBACK + error "SEATS_ALREADY_BOOKED"
4. If clear → INSERT booking + booking_seats
5. COMMIT
```

The `UNIQUE(show_id, seat_id)` constraint on `booking_seats` provides a second safety net at the database level.

---

## 📊 Database Schema

Uses **10 tables** with proper normalization (3NF), foreign keys, indexes, and constraints:

- `users` — Authentication with bcrypt
- `halls` — Auditoriums
- `seats` — Individual seats (row, number, category)
- `movies` — Movie catalog
- `shows` — Showtimes linking movies to halls
- `seat_pricings` — Per-show, per-category pricing
- `bookings` — Booking records
- `booking_seats` — Many-to-many (booking ↔ seat per show)
- `audit_logs` — Action tracking
- Prisma migrations for schema management

### Key Indexes
- `show_id` + `seat_id` composite on `booking_seats` (double-booking prevention)
- `hall_id` + `row_number` + `seat_number` composite on `seats` (seat lookup)
- `show_datetime` on `shows` (date filtering)
- `user_id` on `bookings` (user dashboard)

---

## 🌐 Deployment Guide (Render)

1. Create a **PostgreSQL** database on Render
2. Create a **Web Service** → connect Git repo
3. Set build command: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
4. Set start command: `cd backend && node server.js`
5. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
6. Deploy!

---

## 📄 License

MIT — Built by **Akshat Kaushik**
