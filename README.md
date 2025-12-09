
# Qblink Queue Management System - Cloud Ready

A fully operational, full-stack queue management system designed for cloud deployment.

## Tech Stack
- **Frontend:** React, TypeScript, TailwindCSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **Real-time:** Socket.io

---

## 🚀 Deployment Guide

### 1. Backend & Database (Render.com)

1. **Create Database:**
   - Sign up at [Render.com](https://render.com).
   - Create a new **PostgreSQL** database.
   - Copy the `Internal Database URL` (for internal communication) or `External Database URL`.

2. **Deploy Backend Service:**
   - Create a new **Web Service** on Render connected to this repository.
   - **Build Command:** `npm install && npx tsc` (Ensure `tsconfig.json` compiles backend files)
   - **Start Command:** `node backend/server.js` (or output location from tsc)
   - **Environment Variables:**
     - `DATABASE_URL`: Your Render Postgres URL.
     - `JWT_SECRET`: A secure random string.
     - `PORT`: `3000` (Render sets this automatically, but good to have).

3. **Initialize Database:**
   - Once the database is running, connect to it using a tool like DBeaver or TablePlus.
   - Run the contents of `backend/schema.sql` to create the tables.

### 2. Frontend (Vercel)

1. **Deploy Frontend:**
   - Sign up at [Vercel.com](https://vercel.com).
   - Import this repository.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL`: The URL of your deployed backend + `/api` (e.g., `https://qblink-backend.onrender.com/api`)
     - `VITE_SOCKET_URL`: The URL of your deployed backend (e.g., `https://qblink-backend.onrender.com`)

---

## 🛠 Local Development

1. **Setup Backend:**
   - Create a `.env` file in the root:
     ```
     DATABASE_URL=postgres://user:pass@localhost:5432/qblink_db
     JWT_SECRET=local_secret
     PORT=3000
     ```
   - Run: `npx ts-node backend/server.ts`

2. **Setup Frontend:**
   - Run: `npm start` (or `npm run dev`)
   - It will connect to `localhost:3000` by default.

---

## ✅ Features
- **Real-time:** Updates across Dashboard, Customer View, and Display Screen instantly.
- **Secure:** JWT Authentication & Password Hashing.
- **Mobile First:** Optimized for all devices.
- **Persistent:** PostgreSQL storage (No LocalStorage limitations).
