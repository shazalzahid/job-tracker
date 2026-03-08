const express = require('express');
const db = require('../db');

const router = express.Router();

// All routes require req.userId (set by auth middleware)

// GET all applications (optional ?status= filter)
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC';
    const params = [req.userId];
    if (status) {
      sql = 'SELECT * FROM applications WHERE user_id = ? AND status = ? ORDER BY created_at DESC';
      params.push(status);
    }
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one by id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', (req, res) => {
  try {
    const { company, role, status = 'Applied', applied_at, notes, link } = req.body;
    if (!company || !role) {
      return res.status(400).json({ error: 'company and role are required' });
    }
    const stmt = db.prepare(`
      INSERT INTO applications (user_id, company, role, status, applied_at, notes, link)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.userId, company, role, status, applied_at || null, notes || null, link || null);
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { company, role, status, applied_at, notes, link } = req.body;
    db.prepare(`
      UPDATE applications
      SET company = ?, role = ?, status = ?, applied_at = ?, notes = ?, link = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      company ?? existing.company,
      role ?? existing.role,
      status ?? existing.status,
      applied_at !== undefined ? applied_at : existing.applied_at,
      notes !== undefined ? notes : existing.notes,
      link !== undefined ? link : existing.link,
      req.params.id,
      req.userId
    );
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
