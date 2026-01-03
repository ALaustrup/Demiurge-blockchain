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
  // Check if table exists and get its structure
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='abyssid_identities'", (err, table) => {
    if (err) {
      console.error('Error checking table:', err);
    } else if (!table) {
      // Table doesn't exist, create it
      console.log('Creating abyssid_identities table...');
      db.run(`
        CREATE TABLE abyssid_identities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL COLLATE NOCASE,
          public_key TEXT NOT NULL,
          address TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          last_seen INTEGER
        )
      `);
      
      db.run(`
        CREATE INDEX idx_username ON abyssid_identities(username)
      `);

      db.run(`
        CREATE INDEX idx_address ON abyssid_identities(address)
      `);
      console.log('Table created successfully');
    } else {
      console.log('Table abyssid_identities already exists');
      // Table exists - verify it has the right structure
      // If needed, we could add a migration here to update existing tables
    }
  });
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

  // Normalize username
  const normalizedUsername = username.toLowerCase().trim();
  console.log(`[CHECK] Checking username: "${username}" -> normalized: "${normalizedUsername}"`);
  
  // First, let's check what's actually in the database for debugging
  db.all('SELECT username FROM abyssid_identities', (err, allRows) => {
    if (err) {
      console.error('[CHECK] Error fetching all usernames:', err);
    } else {
      console.log(`[CHECK] Total identities in database: ${allRows.length}`);
      if (allRows.length > 0) {
        console.log(`[CHECK] Existing usernames:`, allRows.map(r => r.username));
      }
    }
  });
  
  // Check if username exists (use LOWER() for case-insensitive matching)
  // Since we're storing normalized usernames, we can just do a direct comparison
  db.get(
    'SELECT username FROM abyssid_identities WHERE username = ?',
    [normalizedUsername],
    (err, row) => {
      if (err) {
        console.error('[CHECK] Database error:', err);
        return res.status(500).json({ available: false, error: 'Database error' });
      }

      if (row) {
        console.log(`[CHECK] Username "${normalizedUsername}" is taken (found: "${row.username}")`);
        return res.json({ available: false, error: 'Username already taken' });
      }

      console.log(`[CHECK] Username "${normalizedUsername}" is available`);
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

  // Check availability first (use LOWER() for case-insensitive username matching)
  db.get(
    'SELECT username FROM abyssid_identities WHERE LOWER(TRIM(username)) = ? OR address = ?',
    [normalizedUsername, address],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        // Check if it's a username conflict or address conflict
        const rowUsernameLower = row.username ? row.username.toLowerCase().trim() : '';
        return res.status(409).json({ 
          error: rowUsernameLower === normalizedUsername 
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
  const normalizedUsername = username.toLowerCase().trim();

  db.get(
    'SELECT * FROM abyssid_identities WHERE LOWER(TRIM(username)) = ?',
    [normalizedUsername],
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
        publicKey: row.public_key,
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

// Debug endpoint to list all usernames (for troubleshooting)
app.get('/api/abyssid/debug/list', (req, res) => {
  db.all('SELECT id, username, address, created_at FROM abyssid_identities ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error('Debug list error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ count: rows.length, identities: rows });
  });
});

// Debug endpoint to clear all identities (for testing only)
app.post('/api/abyssid/debug/clear', (req, res) => {
  db.run('DELETE FROM abyssid_identities', (err) => {
    if (err) {
      console.error('Debug clear error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, message: 'All identities cleared' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`AbyssID Backend running on port ${PORT}`);
  console.log(`Database: ${dbPath}`);
});

