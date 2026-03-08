const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const applicationsRouter = require('./routes/applications');
const authRouter = require('./routes/auth');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/applications', authMiddleware, applicationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// 404 for unknown API routes (return JSON so client gets a clear message)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found', path: req.path });
});

// In production, serve the built React app (when client/dist exists)
if (isProduction) {
  const distPath = path.join(__dirname, '../client/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Always respond with JSON on errors (so client doesn't see "Request failed")
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Job Tracker API running at http://localhost:${PORT}`);
});
