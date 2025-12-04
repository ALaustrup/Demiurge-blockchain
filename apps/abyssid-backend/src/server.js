import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = process.env.DB_PATH || join(__dirname, '../data/abyssid.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS abyssid_identities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_seen INTEGER
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_username ON abyssid_identities(username)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_address ON abyssid_identities(address)
  `);
});

// Routes

// Check username availability
app.post('/api/abyssid/check', (req, res) => {
  const { username } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({ 
      available: false, 
      error: 'Username must be at least 3 characters' 
    });
  }

  // Check if username exists
  db.get(
    'SELECT username FROM abyssid_identities WHERE username = ?',
    [username.toLowerCase().trim()],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.json({ available: false, error: 'Username already taken' });
      }

      res.json({ available: true });
    }
  );
});

// Register new AbyssID
app.post('/api/abyssid/register', (req, res) => {
  const { username, publicKey, address } = req.body;

  if (!username || !publicKey || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedUsername = username.toLowerCase().trim();
  const now = Date.now();

  // Check availability first
  db.get(
    'SELECT username FROM abyssid_identities WHERE username = ? OR address = ?',
    [normalizedUsername, address],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(409).json({ 
          error: row.username === normalizedUsername 
            ? 'Username already taken' 
            : 'Address already registered' 
        });
      }

      // Insert new identity
      db.run(
        'INSERT INTO abyssid_identities (username, public_key, address, created_at) VALUES (?, ?, ?, ?)',
        [normalizedUsername, publicKey, address, now],
        function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ error: 'Failed to register identity' });
          }

          res.json({
            success: true,
            id: this.lastID,
            username: normalizedUsername,
            address,
            createdAt: now,
          });
        }
      );
    }
  );
});

// Get identity by username
app.get('/api/abyssid/:username', (req, res) => {
  const { username } = req.params;

  db.get(
    'SELECT * FROM abyssid_identities WHERE username = ?',
    [username.toLowerCase()],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Identity not found' });
      }

      res.json({
        username: row.username,
        address: row.address,
        createdAt: row.created_at,
      });
    }
  );
});

// Get identity by address
app.get('/api/abyssid/by-address/:address', (req, res) => {
  const { address } = req.params;

  db.get(
    'SELECT * FROM abyssid_identities WHERE address = ?',
    [address],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Identity not found' });
      }

      res.json({
        username: row.username,
        address: row.address,
        createdAt: row.created_at,
      });
    }
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'abyssid-backend' });
});

// Start server
app.listen(PORT, () => {
  console.log(`AbyssID Backend running on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
});

