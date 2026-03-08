# Deploying Job Tracker

You can deploy in two ways: **one service** (backend + frontend together) or **two services** (frontend and backend separately).

---

## Render – detailed guide

**Using Render?** See **[docs/RENDER-DEPLOY.md](docs/RENDER-DEPLOY.md)** for a full step-by-step (repo setup, every field, env vars, troubleshooting).

---

## Option 1: One service on Render (simplest)

One URL for the whole app. Render runs Node, builds the React app in the build step, then serves it from Express.

### 1. Push your code to GitHub

Create a repo and push the `job-tracker` folder (or the whole project):

```bash
cd job-tracker
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/job-tracker.git
git push -u origin main
```

### 2. Create a Render Web Service

1. Go to [render.com](https://render.com) and sign up / log in.
2. **New** → **Web Service**.
3. Connect your GitHub repo and select the repo that contains **job-tracker** (or the repo root if the whole project is the repo).
4. Use these settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `job-tracker` (or leave blank if the repo root is job-tracker) |
| **Runtime** | Node |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && npm install` |
| **Start Command** | `cd server && NODE_ENV=production node index.js` |
| **Instance Type** | Free |

5. **Environment** (in the dashboard):

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (generate a long random string, e.g. `openssl rand -hex 32`) |

6. Click **Create Web Service**. Render will build and deploy. Your app will be at `https://YOUR-SERVICE-NAME.onrender.com`.

### Data persistence (SQLite on Render)

On Render’s **free** tier, the filesystem is **ephemeral**: `jobs.db` is lost when the service restarts or redeploys. For a demo or portfolio that’s often fine. For real long-term data, use **Option 2** (separate backend with a database) or add a [Render persistent disk](https://render.com/docs/disks) (paid).

---

## Option 2: Frontend and backend separately

- **Backend** on Render (or Railway, Fly.io).
- **Frontend** on Vercel or Netlify.

You get a URL for the API and a URL for the app; the app calls the API via `VITE_API_URL`.

### 2a. Deploy the backend (Render)

1. **New** → **Web Service**.
2. Connect the same GitHub repo.
3. Settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `job-tracker/server` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |

4. Environment: add `JWT_SECRET` (and optionally `NODE_ENV=production`).
5. Deploy. Note the URL, e.g. `https://job-tracker-api.onrender.com`.

### 2b. Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
2. Settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `job-tracker/client` (or `client` if repo is job-tracker) |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment Variables**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-BACKEND-URL.onrender.com` (no trailing slash) |

4. Deploy. Your app will be at `https://your-project.vercel.app`.

### 2c. CORS

The backend already uses `app.use(cors())`, so the Vercel frontend can call the API. For stricter security you can later restrict CORS to your frontend URL.

---

## Checklist before deploy

- [ ] Set a strong **JWT_SECRET** (never use the default in production).
- [ ] For Option 1: **Root Directory** and **Build** / **Start** commands match the layout (`job-tracker`, `client`, `server`).
- [ ] For Option 2: **VITE_API_URL** is set on the frontend and points to the backend URL (no trailing slash).

---

## Quick reference

| Option | Frontend URL | Backend URL | Best for |
|--------|--------------|-------------|----------|
| 1 – One service (Render) | Same as backend | `https://xxx.onrender.com` | Easiest, one URL |
| 2 – Two services | Vercel/Netlify URL | Render (or other) URL | Separate scaling, optional DB later |
