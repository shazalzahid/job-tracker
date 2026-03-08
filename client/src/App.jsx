import { useState, useEffect } from 'react';
import './App.css';

// Use VITE_API_URL when frontend and backend are deployed separately (e.g. Vercel + Render)
const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';
const AUTH_KEY = 'job_tracker_token';
const USER_KEY = 'job_tracker_user';

function getStoredAuth() {
  try {
    const token = localStorage.getItem(AUTH_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (token && user) return { token, user: JSON.parse(user) };
  } catch (_) {}
  return null;
}

function setStoredAuth(token, user) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

function apiFetch(path, options = {}) {
  const auth = getStoredAuth();
  const headers = { ...options.headers, 'Content-Type': 'application/json' };
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
  return fetch(`${API}${path}`, { ...options, headers });
}

const STATUS_OPTIONS = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

function LoginScreen({ onLogin, error, setError }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || res.statusText || `Error ${res.status}`;
        throw new Error(msg);
      }
      if (!data.token || !data.user) throw new Error('Invalid response from server');
      setStoredAuth(data.token, data.user);
      onLogin();
    } catch (e) {
      const msg = e.message === 'Failed to fetch' || e.message.includes('NetworkError')
        ? "Can't reach server. Make sure the API is running (npm start in the server folder)."
        : e.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card card">
        <h1>Job Tracker</h1>
        <p className="auth-tagline">Sign in to manage your applications</p>
        {error && <div className="banner banner-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min 6 characters' : ''}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          >
            {mode === 'login' ? 'Create an account' : 'Already have an account? Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ onLogout }) {
  const [user] = useState(() => {
    const a = getStoredAuth();
    return a ? a.user : null;
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'Applied',
    applied_at: '',
    notes: '',
    link: '',
  });

  const logout = () => {
    clearStoredAuth();
    onLogout();
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter ? `/applications?status=${encodeURIComponent(statusFilter)}` : '/applications';
      const res = await apiFetch(url);
      if (res.status === 401) {
        clearStoredAuth();
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplications(data);
    } catch (e) {
      setError(e.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const resetForm = () => {
    setForm({
      company: '',
      role: '',
      status: 'Applied',
      applied_at: '',
      notes: '',
      link: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      applied_at: form.applied_at || null,
      notes: form.notes || null,
      link: form.link || null,
    };
    try {
      if (editingId) {
        const res = await apiFetch(`/applications/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.status === 401) { onLogout(); return; }
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await apiFetch('/applications', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.status === 401) { onLogout(); return; }
        if (!res.ok) throw new Error('Create failed');
      }
      resetForm();
      fetchApplications();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (app) => {
    setForm({
      company: app.company,
      role: app.role,
      status: app.status,
      applied_at: app.applied_at ? app.applied_at.slice(0, 10) : '',
      notes: app.notes || '',
      link: app.link || '',
    });
    setEditingId(app.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return;
    try {
      const res = await apiFetch(`/applications/${id}`, { method: 'DELETE' });
      if (res.status === 401) { onLogout(); return; }
      fetchApplications();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Job Tracker</h1>
          <div className="header-user">
            <span className="user-email">{user?.email}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
          </div>
        </div>
        <p className="tagline">Track applications and stay organized</p>
        <div className="header-actions">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            + Add application
          </button>
        </div>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">{error}</div>
      )}

      {showForm && (
        <section className="card form-card">
          <h2>{editingId ? 'Edit application' : 'New application'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <label>Company * <input required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company name" /></label>
              <label>Role * <input required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Job title" /></label>
            </div>
            <div className="form-row">
              <label>Status <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label>Applied date <input type="date" value={form.applied_at} onChange={(e) => setForm((f) => ({ ...f, applied_at: e.target.value }))} /></label>
            </div>
            <label>Job link <input type="url" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." /></label>
            <label>Notes <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" rows={3} /></label>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Add application'}</button>
            </div>
          </form>
        </section>
      )}

      <section className="list-section">
        {loading ? (
          <p className="loading-state">Loading</p>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <p>No applications yet.</p>
            <p className="muted">Add one to get started.</p>
          </div>
        ) : (
          <ul className="application-list">
            {applications.map((app) => (
              <li key={app.id} className="card application-card">
                <div className="app-main">
                  <div className="app-head">
                    <h3>{app.company}</h3>
                    <span className={`status status-${app.status.toLowerCase()}`}>{app.status}</span>
                  </div>
                  <p className="app-role">{app.role}</p>
                  {app.applied_at && <p className="app-date muted">Applied {new Date(app.applied_at).toLocaleDateString()}</p>}
                  {app.notes && <p className="app-notes">{app.notes}</p>}
                  {app.link && <a href={app.link} target="_blank" rel="noopener noreferrer" className="app-link">View posting →</a>}
                </div>
                <div className="app-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleEdit(app)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(app.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const [authError, setAuthError] = useState(null);

  const logout = () => setAuth(null);

  if (auth) {
    return <Dashboard onLogout={logout} />;
  }
  return (
    <LoginScreen
      onLogin={() => setAuth(getStoredAuth())}
      error={authError}
      setError={setAuthError}
    />
  );
}

export default App;
