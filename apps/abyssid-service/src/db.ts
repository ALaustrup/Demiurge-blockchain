import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.SQLITE_PATH || join(__dirname, '../../data/abyssid.sqlite');
  dbInstance = new Database(dbPath);
  
  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');
  
  // Initialize schema
  initSchema(dbInstance);
  
  return dbInstance;
}

function initSchema(db: Database.Database) {
  // abyssid_users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS abyssid_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT,
      display_name TEXT,
      avatar_url TEXT,
      metadata TEXT,
      UNIQUE(username)
    )
  `);

  // abyssid_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS abyssid_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);

  // abyssid_keys table (for multiple keys per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS abyssid_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      public_key TEXT NOT NULL,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, public_key),
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);

  // drc369_assets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS drc369_assets (
      id TEXT PRIMARY KEY,
      owner_user_id INTEGER NOT NULL,
      origin_chain TEXT NOT NULL,
      standard TEXT NOT NULL,
      name TEXT,
      description TEXT,
      uri TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      wrapped INTEGER NOT NULL DEFAULT 0,
      raw_payload TEXT,
      on_chain INTEGER NOT NULL DEFAULT 0,
      tx_hash TEXT,
      block_height INTEGER,
      FOREIGN KEY (owner_user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);
  
  // Add on-chain columns if they don't exist (migration)
  try {
    db.exec(`
      ALTER TABLE drc369_assets ADD COLUMN on_chain INTEGER NOT NULL DEFAULT 0;
    `);
  } catch {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`
      ALTER TABLE drc369_assets ADD COLUMN tx_hash TEXT;
    `);
  } catch {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`
      ALTER TABLE drc369_assets ADD COLUMN block_height INTEGER;
    `);
  } catch {
    // Column already exists, ignore
  }

  // drc369_events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS drc369_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      from_user_id INTEGER,
      to_user_id INTEGER,
      event_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES drc369_assets(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES abyssid_users(id) ON DELETE SET NULL,
      FOREIGN KEY (to_user_id) REFERENCES abyssid_users(id) ON DELETE SET NULL
    )
  `);

  // runtime_packages table (for WASM registry)
  db.exec(`
    CREATE TABLE IF NOT EXISTS runtime_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      author_user_id INTEGER,
      description TEXT,
      wasm_hash TEXT NOT NULL,
      wasm_size INTEGER NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_user_id) REFERENCES abyssid_users(id) ON DELETE SET NULL
    )
  `);

  // execution_receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS execution_receipts (
      receipt_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      job_id TEXT NOT NULL,
      input_hash TEXT NOT NULL,
      output_hash TEXT NOT NULL,
      vm_logs TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      block_height INTEGER,
      peer_id TEXT,
      execution_time INTEGER,
      merkle_proof TEXT,
      zk_proof TEXT,
      pub_inputs_root TEXT,
      output_root TEXT,
      jobs_hash TEXT,
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);
  
  // compute_providers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS compute_providers (
      peer_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      stake_amount REAL NOT NULL DEFAULT 0.0,
      trust_score REAL NOT NULL DEFAULT 100.0,
      success_rate REAL NOT NULL DEFAULT 1.0,
      zk_verified_count INTEGER NOT NULL DEFAULT 0,
      slash_count INTEGER NOT NULL DEFAULT 0,
      total_jobs INTEGER NOT NULL DEFAULT 0,
      successful_jobs INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON abyssid_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON abyssid_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_keys_user_id ON abyssid_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_drc369_owner ON drc369_assets(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_drc369_chain ON drc369_assets(origin_chain);
    CREATE INDEX IF NOT EXISTS idx_drc369_events_asset ON drc369_events(asset_id);
    CREATE INDEX IF NOT EXISTS idx_runtime_packages_author ON runtime_packages(author_user_id);
    CREATE INDEX IF NOT EXISTS idx_runtime_packages_name ON runtime_packages(name);
    CREATE INDEX IF NOT EXISTS idx_execution_receipts_user ON execution_receipts(user_id);
    CREATE INDEX IF NOT EXISTS idx_execution_receipts_job ON execution_receipts(job_id);
    CREATE INDEX IF NOT EXISTS idx_compute_providers_user ON compute_providers(user_id);
    CREATE INDEX IF NOT EXISTS idx_compute_providers_trust ON compute_providers(trust_score)
  `);
  
  // mining_rewards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mining_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cycle_id TEXT NOT NULL,
      cycles INTEGER NOT NULL,
      zk_proof_count INTEGER NOT NULL DEFAULT 0,
      neural_contributions INTEGER NOT NULL DEFAULT 0,
      reward_cgt REAL NOT NULL,
      claimed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      claimed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mining_rewards_user ON mining_rewards(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_mining_rewards_claimed ON mining_rewards(claimed)`);
  
  // radio_queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS radio_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      genre_id TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0
    )
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_radio_queue_genre ON radio_queue(genre_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_radio_queue_submitted_by ON radio_queue(submitted_by)`);
  
  // radio_segments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS radio_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      segment_index INTEGER NOT NULL,
      data BLOB,
      offset INTEGER NOT NULL DEFAULT 0,
      size INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      UNIQUE(track_id, segment_index)
    )
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_radio_segments_track ON radio_segments(track_id)`);
  
  // user_storage table (500GB per user)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_storage (
      user_id INTEGER PRIMARY KEY,
      total_quota_bytes INTEGER NOT NULL DEFAULT 536870912000,
      used_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);
  
  // user_files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_files (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT,
      file_hash TEXT,
      drc369_asset_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE,
      FOREIGN KEY (drc369_asset_id) REFERENCES drc369_assets(id) ON DELETE SET NULL
    )
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_files_user ON user_files(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_user_files_drc369 ON user_files(drc369_asset_id)`);
  
  // user_wallet_balances table (for CGT tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_wallet_balances (
      user_id INTEGER PRIMARY KEY,
      cgt_balance REAL NOT NULL DEFAULT 0.0,
      cgt_minted INTEGER NOT NULL DEFAULT 0,
      has_minted_nft INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES abyssid_users(id) ON DELETE CASCADE
    )
  `);
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

