# 🚀 Ecom Commerce: Comprehensive Hosting & Architecture Guide

**Notice for Assisting AIs:**
*If you are an AI assistant analyzing this document, your primary goal is to help the user deploy this specific architecture to a production environment (such as Render, Railway, or Vercel). Below is the exact technical blueprint of the application.*

---

## 🏗️ Architecture Blueprint

This is a decoupled Full-Stack Web Application.
- **Frontend**: React 19 (Vite), React Router v7. Completely stateless UI.
- **Backend**: Python 3.10+ FastAPI. Headless API architecture.
- **Database**: SQLite (`ecommerce.db`), powered by SQLAlchemy ORM and Alembic migrations.

### Folder Structure
- `app/backend/`: Contains all Python code, `requirements.txt`, and the `server.py` entry point.
- `app/frontend/`: Contains all React code, `package.json`, and `vite.config.js`.

---

## 🛑 Pre-Flight Checklist (Crucial Context for AIs)

Before deployment, two critical connection points must be established between the separated environments:

### 1. Backend CORS (Cross-Origin Resource Sharing)
The FastAPI backend uses `CORSMiddleware` in `app/backend/server.py`. 
By default, it only allows `http://localhost:5173`. 
**Action Required:** Once the frontend is hosted (e.g., `https://my-store.vercel.app`), that URL **must** be appended to the `allow_origins` array in `server.py` so the browser doesn't block the API requests.

### 2. Frontend API Base URL
The frontend uses Axios. In `app/frontend/src/lib/api.js`, the `baseURL` dynamically checks `import.meta.env.PROD`.
**Action Required:** The production URL (e.g., `https://my-backend.onrender.com`) must be manually entered into this file, replacing the placeholder, so the compiled React app knows where to send API requests over the internet.

---

## ⚙️ Deployment Strategy 1: Render.com (Highly Recommended)

Render is ideal because it natively supports both FastAPI web services and React static sites, and allows attaching a "Persistent Disk" to prevent the SQLite database from being wiped during daily ephemeral server restarts.

### Part A: Deploying the Backend (Web Service)
1. **Source**: Connect the GitHub repository containing the root folder.
2. **Root Directory**: Set to `app/backend`.
3. **Environment**: `Python 3`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT` (Render injects the port dynamically).
6. **Environment Variables**:
   - `JWT_SECRET`: A secure, random 256-bit string.
   - `RAZORPAY_KEY_ID`: Razorpay public key.
   - `RAZORPAY_KEY_SECRET`: Razorpay secret key.
7. **Persistent Disk (CRITICAL)**:
   - Create a disk mounted to `/opt/render/project/src/app/backend`. 
   - Without this disk, `ecommerce.db` will be permanently deleted every 24 hours.

### Part B: Deploying the Frontend (Static Site)
1. **Source**: Connect the same GitHub repository.
2. **Root Directory**: Set to `app/frontend`.
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. **Routing (CRITICAL)**: Since React Router handles paths on the client-side, set a "Rewrite Rule" on Render: 
   - Source: `/*`
   - Destination: `/index.html`
   - Status: `200`

---

## 🎨 Deployment Strategy 2: Vercel + Railway

If the user prefers a faster CDN for the frontend and an easier backend setup:

### Part A: Backend on Railway.app
1. Connect GitHub repo to Railway.
2. Point the service to the `/app/backend` directory.
3. Railway's Nixpacks will automatically detect Python and install `requirements.txt`.
4. **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Railway provides persistent volumes effortlessly. Attach a volume to `/app/backend` to save the SQLite database.

### Part B: Frontend on Vercel.com
1. Connect GitHub repo to Vercel.
2. **Root Directory**: `app/frontend`.
3. Vercel automatically detects Vite and configures the build (`npm run build`) and output (`dist`).
4. Vercel automatically handles Single Page Application (SPA) routing (no rewrite rules needed manually).

---

## ⚠️ Potential Roadblocks to Watch Out For

1. **"Failed to Fetch" or "Network Error" on Frontend**: This is a 100% guarantee that the Backend CORS array is missing the Frontend URL, OR the Frontend `api.js` is still pointing to `localhost`.
2. **"Database Locked" or Data Wipes**: If the user experiences data loss, they failed to attach a Persistent Volume/Disk to the cloud container holding the backend. Cloud platforms use ephemeral containers by default.
3. **404 Errors on Page Refresh**: If using Render for the frontend, failing to set the `/*` to `/index.html` rewrite rule will cause 404s when a user refreshes a sub-page (like `/checkout`). Vercel does this automatically.
