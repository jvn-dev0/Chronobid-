# ChronoBid Deployment Guide

This directory (`main`) contains the clean, production-ready source code for **ChronoBid** ready for cloud deployment.

---

## 🚀 1. Frontend Deployment (Vercel)
* **Framework:** Next.js
* **Root Directory for Vercel:** `credentials`
* **Build Command:** `npm run build`
* **Output Directory:** `.next`
* **Environment Variables:**
  * `NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com`

---

## ⚙️ 2. Backend Deployment (Render / Railway)
* **Root Directory:** `backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
* **Environment Variables:**
  * `DATABASE_URL=postgresql://user:password@host:5432/dbname`
  * `SECRET_KEY=your_jwt_secret_key`
  * `ALGORITHM=HS256`

---

## 🤖 3. Jasper AI Orchestrator (Render / Railway)
* **Root Directory:** `Ai/jasper-bot`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8004`
* **Environment Variables:**
  * `ANTHROPIC_API_KEY=your_anthropic_api_key_here`
  * `ANTHROPIC_MODEL=claude-3-5-sonnet-20241022`
  * `ITEM_VERIFY_URL=http://localhost:8001`

---

## 🗄️ 4. Database Setup (Neon.tech or Supabase)
1. Create a PostgreSQL database instance on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Set `DATABASE_URL` in `backend/.env`.
3. SQLAlchemy handles table creation automatically on startup via `models.Base.metadata.create_all(bind=engine)`.
