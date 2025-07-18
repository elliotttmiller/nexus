# Nexus Monorepo Railway Deployment Guide

This guide explains how to deploy each part of your Nexus monorepo to Railway as separate services.

---

## 1. Backend API (Node.js)
- **Root Directory:** `nexus-backend/`
- **Build Method:** Nixpacks (auto-detect)
- **Start Command:** `npm start` (auto-detect from package.json)
- **Environment Variables:**
  - `DATABASE_URL` (from Railway PostgreSQL)
  - `JWT_SECRET`
  - Any others from `env.example`

**Steps:**
1. In Railway, create a new service or select your backend service.
2. In Settings, set the **Root Directory** to `nexus-backend/`.
3. Make sure the build method is **Nixpacks** (not Docker).
4. Add environment variables in the Variables tab.
5. Redeploy.

---

## 2. AI/ML Service (Python)
- **Root Directory:** `nexus-ai/`
- **Build Method:** Nixpacks (auto-detect)
- **Start Command:** `python app.py` (or as needed)
- **Environment Variables:**
  - `SENTRY_DSN`
  - Any others from `env.example`

**Steps:**
1. In Railway, create a new service.
2. Set the **Root Directory** to `nexus-ai/`.
3. Set the start command to `python app.py` (or as needed).
4. Add environment variables.
5. Redeploy.

---

## 3. Database (PostgreSQL)
- In Railway, click **Add New → Database → PostgreSQL**.
- Copy the `DATABASE_URL` and add it to your backend service’s environment variables.

---

## 4. Mobile App (React Native)
- Not deployed on Railway. Use the backend API URL in your app config.

---

## 5. General Tips
- **Do not deploy from the root** unless you have a root `package.json` and want to use workspaces.
- **No Dockerfiles** unless you want to use Docker explicitly.
- **Each service = one Railway service, with its own root directory.**

---

## 6. Example Environment Files
See `nexus-backend/env.example` and `nexus-ai/env.example` for required variables.

---

## 7. Troubleshooting
- If Railway tries to use Maven/Java, check your root directory and build method.
- If you see Docker build errors, make sure there are no Dockerfiles in your deployment context.
- Each service should only see its own files and dependencies.

---

**Happy deploying!** 