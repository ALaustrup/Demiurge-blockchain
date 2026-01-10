const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8082;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'qorid.sqlite');
const db = new Database(dbPath);

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS abyssid_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  public_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME
);

CREATE INDEX IF NOT EXISTS idx_username ON abyssid_users(username);
`);

console.log('[QorID Service] Database initialized:', dbPath);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'online', service: 'qorid', timestamp: new Date().toISOString() });
});

app.get('/api/qorid/username-available', (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const user = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(username.toLowerCase());
    res.json({ available: !user });
  } catch (error) {
    console.error('[username-available] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/qorid/register', (req, res) => {
  try {
    const { username, publicKey } = req.body;
    
    if (!username || !publicKey) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Username and publicKey required' } });
    }
    
    const normalizedUsername = username.toLowerCase();
    
    // Check if username already exists
    const existing = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: { code: 'USERNAME_TAKEN', message: 'Username already taken' } });
    }
    
    // Insert new user
    const result = db.prepare(`
      INSERT INTO abyssid_users (username, public_key, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(normalizedUsername, publicKey);
    
    console.log('[register] New user:', normalizedUsername, 'ID:', result.lastInsertRowid);
    
    res.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username: normalizedUsername,
        publicKey: publicKey
      }
    });
  } catch (error) {
    console.error('[register] Error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to register user' } });
  }
});

app.get('/api/qorid/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, created_at FROM abyssid_users ORDER BY created_at DESC LIMIT 100').all();
    res.json({ users, total: users.length });
  } catch (error) {
    console.error('[users] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[QorID Service] Running on http://0.0.0.0:${PORT}`);
  console.log('[QorID Service] Database:', dbPath);
  console.log('[QorID Service] Ready to accept registrations!');
});
