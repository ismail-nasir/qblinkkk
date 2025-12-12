
# Qblink - Queue Management System

A frictionless, glass-morphic queue management system using modern aesthetics and AI insights.

## 🚀 How to Make It Work on Vercel (Cross-Device)

By default, Qblink runs in "Mock Mode" using LocalStorage. This means data stays on one device. To make it work across devices (Laptop ↔ Phone), you must connect it to a free **Firebase** database.

### Step 1: Create a Free Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Click **"Add project"** and name it `qblink-app` (or anything you want).
3. Disable Google Analytics (optional) and create the project.

### Step 2: Enable Realtime Database
1. In the Firebase console, go to **Build** > **Realtime Database**.
2. Click **Create Database**.
3. Select a location (e.g., United States).
4. **Crucial:** Select **Start in Test Mode**. This allows anyone with your app to read/write data without complex auth setup initially.
   * *Note: For production, you should set up rules, but Test Mode is perfect for this demo.*

### Step 3: Get API Keys
1. Go to Project Settings (Gear icon > Project settings).
2. Scroll down to "Your apps". Click the web icon (`</>`) to create a web app.
3. Register the app (no need for hosting).
4. You will see a `firebaseConfig` object. Keep this tab open.

### Step 4: Add Environment Variables to Vercel
1. Go to your project dashboard on [Vercel.com](https://vercel.com).
2. Go to **Settings** > **Environment Variables**.
3. Copy the values from your Firebase config and add them as follows:

| Vercel Key | Firebase Value |
|------------|----------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_DATABASE_URL` | `databaseURL` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

4. **Redeploy** your app on Vercel (Go to Deployments > Redeploy).

### 🎉 Done!
Once redeployed, the app will automatically detect the Firebase keys and switch to "Cloud Mode". 
- Create an account on your laptop.
- Open the site on your phone and **Login** with the same credentials.
- You will see the synced dashboard and queues!

---

## Local Development
To run locally with Firebase, create a `.env` file in the root directory with the same keys above.

```bash
npm install
npm run dev
```
