
# Qblink - Queue Management System

Qblink is a modern, real-time queue management system.

## 🚀 Deployment Guide

This application consists of a React Frontend and a Node.js/Express Backend.

### 1. Database Setup (PostgreSQL)
You need a hosted PostgreSQL database.
- **Providers:** Neon.tech, Supabase, Railway, Render.
- **Action:** Create a database and copy the **Connection String**.
- **Schema:** Run the contents of `backend/schema.sql` in your database SQL editor to create the tables.

### 2. Backend Deployment
Deploy the `backend` folder to a Node.js host.
- **Providers:** Render, Railway, Heroku.
- **Environment Variables:**
  - `PORT`: `3000` (or set by provider)
  - `DATABASE_URL`: Your PostgreSQL Connection String
  - `JWT_SECRET`: A long random string
- **Build Command:** `npm install && npx tsc`
- **Start Command:** `node backend/server.js` (or `npx ts-node backend/server.ts`)

### 3. Frontend Deployment
Deploy the project root to a static site host.
- **Providers:** Vercel, Netlify.
- **Environment Variables:**
  - `VITE_API_URL`: The URL of your deployed backend + `/api` (e.g., `https://my-backend.onrender.com/api`)
  - `VITE_SOCKET_URL`: The URL of your deployed backend (e.g., `https://my-backend.onrender.com`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 🛠 Local Development
1. Start Backend:
   ```bash
   # Set .env with local DB credentials
   npx ts-node backend/server.ts
   ```
2. Start Frontend:
   ```bash
   npm start
   ```
