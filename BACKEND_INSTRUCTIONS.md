
# Qblink Backend Setup Guide

You have successfully generated the backend code for Qblink. Since this environment is frontend-only, you must run the backend separately.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Cloud like Supabase/Neon)

## 1. Project Structure
Move the files from the `backend/` folder to a new directory or keep them alongside your frontend.

## 2. Install Dependencies
Run the following commands in your backend folder:

```bash
npm init -y
npm install express pg bcryptjs jsonwebtoken cors helmet zod socket.io dotenv
npm install --save-dev typescript @types/node @types/express @types/pg @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
```

## 3. Database Setup
1. Create a PostgreSQL database (e.g., `qblink_db`).
2. Run the SQL script found in `backend/schema.sql` to create tables.

## 4. Environment Variables
Create a `.env` file:
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/qblink_db
JWT_SECRET=your_super_secure_secret_key_change_this
FRONTEND_URL=http://localhost:5173
```

## 5. Running the Server
```bash
npx ts-node backend/server.ts
```

## 6. Connecting Frontend
To switch your frontend to use this backend instead of LocalStorage:
1. Open `services/queue.ts` and `services/auth.ts`.
2. Replace the `localStorage` logic with `fetch('http://localhost:3000/api/...')` calls.
3. Use the JWT token returned from login in the `Authorization` header.
