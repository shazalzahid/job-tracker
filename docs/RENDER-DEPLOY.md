# Deploying Job Tracker on Render (step-by-step)

This guide walks you through deploying the full app (frontend + backend) as **one Web Service** on Render.

---

## 1. Prepare your repo

Render needs a GitHub (or GitLab) repo. The service will run from a **root directory** that contains both `client` and `server` folders.

**Recommended:** Push only the `job-tracker` folder as the repo root so paths are simple.

```bash
# From your machine, go into job-tracker (or wherever client + server live)
cd "/Users/shazalzahid/Desktop/job-application-helper/untitled folder/job-tracker"

# Initialize git if you haven’t
git init

# Add everything
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub (e.g. github.com/YOUR_USERNAME/job-tracker)
# Then add it as remote and push (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/job-tracker.git
git branch -M main
git push -u origin main
```

After this, the repo root should look like:

```
job-tracker/          ← Render "Root Directory" = blank or "."
├── client/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── index.js
│   ├── package.json
│   └── ...
├── DEPLOY.md
└── README.md
```

If your repo is different (e.g. repo root is `job-application-helper` and job-tracker is inside a subfolder), use that subfolder as **Root Directory** in Render (e.g. `untitled folder/job-tracker` — no leading slash).

---

## 2. Create a JWT secret

You must set `JWT_SECRET` in production. Generate a random string and keep it safe:

**On Mac/Linux (Terminal):**
```bash
openssl rand -hex 32
```

Copy the output (e.g. `a1b2c3d4e5...`). You’ll paste it into Render in the next step.

---

## 3. Create the Web Service on Render

### 3.1 Open Render and start a new service

1. Go to **https://render.com** and sign in (or create an account; you can use GitHub).
2. In the dashboard, click **New +** → **Web Service**.
3. Connect your GitHub account if asked, then select the **repository** that contains Job Tracker (e.g. `job-tracker`).
4. Click **Connect**.

### 3.2 Basic settings

| Field | What to enter |
|--------|----------------|
| **Name** | Any name (e.g. `job-tracker`). This becomes part of the URL: `https://job-tracker-XXXX.onrender.com`. |
| **Region** | Choose the one closest to you (e.g. Oregon (US West) or Frankfurt). |
| **Branch** | `main` (or whatever branch you push to). |
| **Root Directory** | Leave **blank** if the repo root is the folder that contains `client` and `server`. Otherwise enter the path to that folder (e.g. `untitled folder/job-tracker`). |
| **Runtime** | **Node**. |
| **Instance Type** | **Free** (for testing/demo). |

### 3.3 Build & start commands

These tell Render how to build the React app and run the server.

**Build Command:**
```bash
cd client && npm install && npm run build && cd ../server && npm install
```

What it does: installs frontend deps, builds the Vite app into `client/dist`, then installs server deps.

**Start Command:**
```bash
cd server && NODE_ENV=production node index.js
```

What it does: runs the Node server; with `NODE_ENV=production` it will serve the built app from `client/dist`.

Leave **Docker** unchecked (you’re using Node, not a Dockerfile).

### 3.4 Environment variables

Before clicking **Create Web Service**, open the **Environment** section and add:

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | So the server serves the React build and uses production behavior. |
| `JWT_SECRET` | *(paste the long string you generated in step 2)* | Required for auth; use a long random value. |

- Click **Add Environment Variable** for each.
- **Save** or **Create Web Service** when done.

### 3.5 Deploy

Click **Create Web Service**. Render will:

1. Clone the repo
2. Run the **Build Command** (can take a few minutes)
3. Run the **Start Command**
4. Assign a URL like `https://job-tracker-xxxx.onrender.com`

Wait until the status is **Live** (green). The first time you open the URL, the free instance may take 30–60 seconds to wake up; after that it’s faster until it spins down again from inactivity.

---

## 4. After deploy

- **App URL:** `https://YOUR-SERVICE-NAME.onrender.com`  
  Open it in a browser; you should see the Job Tracker login screen.
- **Register** a new account and use the app as normal.
- **Data:** On the free tier, the SQLite file (`jobs.db`) is on an ephemeral disk. Data can be lost on redeploys or restarts. For a portfolio/demo this is usually acceptable; for long-term data you’d add a database or a paid persistent disk later.

---

## 5. Troubleshooting

### Build fails

- **“Cannot find module …”**  
  The build is not running from the folder that contains both `client` and `server`. Fix **Root Directory** so it points to that folder (or leave it blank if the repo root is correct).
- **“npm ERR! …”**  
  Check that the **Build Command** is exactly:
  `cd client && npm install && npm run build && cd ../server && npm install`  
  and that it runs from the root directory you set.
- **Node version**  
  Render usually uses a recent Node LTS. If you need a specific version, add a **.nvmrc** file in the repo root (e.g. `20`) or set **NODE_VERSION** in Environment.

### Service starts but app doesn’t load / blank page

- Open the app URL and check the browser **Developer Tools** (F12) → **Console** and **Network**.
- If you see 404s for JS/CSS or “Failed to load resource,” the server might not be serving `client/dist`. Confirm:
  - **NODE_ENV** is set to `production`.
  - Build command ran successfully and created `client/dist`.
  - Start command is `cd server && NODE_ENV=production node index.js`.

### 502 Bad Gateway or “Service Unavailable”

- The **Start Command** must run the server (e.g. `node index.js` from the `server` folder). If it’s wrong, the process exits and Render returns 502.
- In Render dashboard, open **Logs** and check for errors right after “Starting service” (e.g. “Cannot find module”, “EADDRINUSE”). Fix the start command or dependencies accordingly.

### Login/register works locally but not on Render

- If you use **Option 2** (frontend elsewhere), the frontend must call your Render backend URL. Set **VITE_API_URL** on the frontend to `https://YOUR-RENDER-URL.onrender.com` (no trailing slash).
- For **one service** on Render, the app and API are on the same URL; no extra env vars are needed on the client.

### First request is very slow

- On the free tier, the instance **spins down** after ~15 minutes of no traffic. The first request after that wakes it up (often 30–60 seconds). This is normal; subsequent requests are fast until it spins down again.

---

## 6. Quick reference

| What | Value |
|------|--------|
| **Root Directory** | Blank (if repo root = folder with `client` + `server`) or path to that folder |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && npm install` |
| **Start Command** | `cd server && NODE_ENV=production node index.js` |
| **Env vars** | `NODE_ENV=production`, `JWT_SECRET=<your-secret>` |
| **App URL** | `https://<your-service-name>.onrender.com` |

---

## 7. Updating the app

After you push changes to the connected branch (e.g. `main`), Render can **auto-deploy** if you left “Auto-Deploy” on. Otherwise use **Manual Deploy** in the dashboard. Each deploy runs the build command again and restarts the server.
