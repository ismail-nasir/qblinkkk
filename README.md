
# Qblink - Cloud Deployment Guide

Qblink is a production-ready Queue Management System.

## Architecture
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL
- **Real-time**: Socket.io

## 1. Deploying the Backend & Database

You can deploy the backend to **Render**, **Railway**, or **Heroku**.

### Option A: Render.com (Recommended)
1. Create a new **PostgreSQL** service on Render. Copy the `Internal Database URL`.
2. Create a new **Web Service** connected to your GitHub repo.
3. **Build Command**: `npm install && npm run build:backend` (Ensure you have a build script or use `npx tsc`)
4. **Start Command**: `node backend/server.js` (or `npx ts-node backend/server.ts`)
5. **Environment Variables**:
   - `DATABASE_URL`: Your Render Postgres URL.
   - `JWT_SECRET`: A long random string.
   - `PORT`: `3000` (Render sets this automatically).

**Database Setup**:
Once the database is running, connect to it using a tool like TablePlus or DBeaver and run the contents of `backend/schema.sql`.

## 2. Deploying the Frontend

Deploy the frontend to **Vercel** or **Netlify**.

1. Import your GitHub repo.
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: The URL of your deployed backend + `/api` (e.g., `https://qblink-backend.onrender.com/api`)
   - `VITE_SOCKET_URL`: The URL of your deployed backend (e.g., `https://qblink-backend.onrender.com`)

## 3. Local Development

1. **Backend**:
   - Create a `.env` file in `backend/` with `DATABASE_URL` (local postgres) and `JWT_SECRET`.
   - Run: `npx ts-node backend/server.ts`
2. **Frontend**:
   - Run: `npm start`
   - By default, it connects to localhost if env vars are missing.
