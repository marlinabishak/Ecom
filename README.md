# Ecom Commerce - Enterprise eCommerce Template

A production-ready, enterprise-grade eCommerce application template built with a modern stack.

## Tech Stack
- **Frontend**: React 19, Vite, React Router v7, Axios, Lucide React, Recharts, Vanilla CSS.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite (Development), PyJWT.
- **Payment**: Razorpay integration.

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Razorpay Account (for production keys)

## Installation & Setup

### 1. Database Setup & Backend Initialization
```bash
cd app/backend
python -m venv .venv
# Activate venv (Windows): .venv\Scripts\activate
# Activate venv (Mac/Linux): source .venv/bin/activate
pip install -r requirements.txt

# Run migrations to create SQLite database tables
alembic upgrade head

# Seed database with sample data (Admin, Products, etc.)
python seed.py
```

### 2. Environment Configuration
Create a `.env` file in `app/backend/` with the following variables:
```env
JWT_SECRET=your-secure-random-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
FRONTEND_URL=http://localhost:5173
```
Create a `.env` file in `app/frontend/` with:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Running the Application

**Terminal 1 (Backend):**
```bash
cd app/backend
uvicorn server:app --reload
```
Server runs at `http://127.0.0.1:8000`.

**Terminal 2 (Frontend):**
```bash
cd app/frontend
npm install
npm run dev
```
Client runs at `http://localhost:5173`.

### 4. Default Login Credentials (from seed.py)
- **Super Admin**: `test_super@shop.com` / `password`
- **Admin**: `test_admin@shop.com` / `password`
- **Support**: `test_support@shop.com` / `password`
- **Customer**: `test_customer@shop.com` / `password`

## Building for Production
To build the frontend for production:
```bash
cd app/frontend
npm run build
```
This generates optimized static files in the `dist` folder.

## Troubleshooting Guide
- **Blank Screen / Network Error**: Ensure the backend is running and `server.py` has the correct `origins` array including your Vite host port.
- **Authentication Fails**: Ensure `JWT_SECRET` matches across restarts, and cookies are not blocked by browser privacy settings.
- **Database Locks**: If migrating to true high-concurrency production, switch the SQLAlchemy connection URL in `db.py` from SQLite to PostgreSQL.
