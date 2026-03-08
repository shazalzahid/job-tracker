# Job Tracker

Full-stack app to track job applications: company, role, status, notes, and links. Built with **Express + SQLite** (REST API) and **React** (Vite).

## Tech stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3), JWT auth (jsonwebtoken), bcryptjs, CORS
- **Frontend:** React 18, Vite
- **API:** Auth — `POST /api/auth/register`, `POST /api/auth/login`; protected REST — `GET/POST/PUT/DELETE /api/applications` (Bearer token)

## Run locally

### 1. Install and run the API

```bash
cd server
npm install
npm start
```

API runs at **http://localhost:3001**.

### 2. Install and run the client

In a new terminal:

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173**. The Vite dev server proxies `/api` to the backend.

## Scripts

| Command        | Where   | Description              |
|----------------|---------|--------------------------|
| `npm start`    | server  | Start API                |
| `npm run dev`  | server  | Start API with watch     |
| `npm run dev`  | client  | Start React dev server   |
| `npm run build`| client  | Production build         |

## API

**Auth (no token):**

| Method | Endpoint               | Body                    | Description        |
|--------|------------------------|-------------------------|--------------------|
| POST   | `/api/auth/register`   | `{ email, password }`   | Create account (6+ chars) |
| POST   | `/api/auth/login`      | `{ email, password }`   | Returns `{ user, token }` |

**Applications (require `Authorization: Bearer <token>`):**

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/applications`         | List current user's (optional `?status=`) |
| GET    | `/api/applications/:id`     | Get one                        |
| POST   | `/api/applications`         | Create                         |
| PUT    | `/api/applications/:id`     | Update                         |
| DELETE | `/api/applications/:id`     | Delete                         |

Data is stored in `server/jobs.db` (SQLite). Each user only sees and edits their own applications.

## Deploy

- **Render (one app):** **[docs/RENDER-DEPLOY.md](docs/RENDER-DEPLOY.md)** – full step-by-step, build/start commands, env vars, troubleshooting.
- **Other options:** [DEPLOY.md](./DEPLOY.md) – Render one-service summary + Option 2 (frontend + backend separate).

Set `JWT_SECRET` in production (e.g. `openssl rand -hex 32`).

## License

MIT
