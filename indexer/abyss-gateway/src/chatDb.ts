/**
 * SQLite database layer for chat system.
 * 
 * Manages chat_users, chat_rooms, chat_room_members, and chat_messages.
 */

import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

const DB_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "chat.db");

let db: Database.Database | null = null;

/**
 * Initialize the database connection and create schema if needed.
 */
export function initChatDb(): Database.Database {
  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Open database
  db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create tables
  createSchema(db);

  return db;
}

/**
 * Get the database instance (must call initChatDb first).
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initChatDb() first.");
  }
  return db;
}

// Export as getChatDb for use in other modules
export const getChatDb = getDb;

/**
 * Create database schema (idempotent).
 */
function createSchema(db: Database.Database) {
  // chat_users
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT,
      is_archon INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // chat_rooms
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      slug TEXT UNIQUE,
      name TEXT UNIQUE,
      description TEXT,
      creator_id INTEGER REFERENCES chat_users(id),
      font_family TEXT DEFAULT 'system-ui',
      font_size INTEGER DEFAULT 14,
      rules TEXT,
      last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // chat_room_members
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
      is_moderator INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, user_id)
    )
  `);

  // chat_messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      nft_id TEXT,
      media_url TEXT,
      media_type TEXT,
      is_blurred INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Migration: Add media columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN media_url TEXT`);
  } catch (e: any) {
    // Column already exists, ignore
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN media_type TEXT`);
  } catch (e: any) {
    // Column already exists, ignore
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }
  try {
    db.exec(`ALTER TABLE chat_messages ADD COLUMN is_blurred INTEGER NOT NULL DEFAULT 0`);
  } catch (e: any) {
    // Column already exists, ignore
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }

  // chat_room_moderators (separate table for clarity, though we also have is_moderator in members)
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_room_moderators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES chat_users(id) ON DELETE CASCADE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, user_id)
    )
  `);

  // system_messages (recurring messages for custom rooms)
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      interval_seconds INTEGER NOT NULL DEFAULT 3600,
      last_sent_at DATETIME,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // developers
  db.exec(`
    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      reputation INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // project_maintainers
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_maintainers (
      project_id INTEGER NOT NULL,
      developer_id INTEGER NOT NULL,
      PRIMARY KEY (project_id, developer_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
    )
  `);

  // dev_capsules
  db.exec(`
    CREATE TABLE IF NOT EXISTS dev_capsules (
      id INTEGER PRIMARY KEY,
      owner_address TEXT NOT NULL,
      project_slug TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      notes TEXT NOT NULL
    )
  `);

  // room_music_queue (music playlist per room)
  db.exec(`
    CREATE TABLE IF NOT EXISTS room_music_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT,
      artist TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      is_playing INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Milestone 7: Operators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('OBSERVER', 'OPERATOR', 'ARCHITECT')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Milestone 5: Ritual Engine tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS rituals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parameters TEXT NOT NULL, -- JSON
      phase TEXT NOT NULL DEFAULT 'idle',
      effects TEXT, -- JSON
      started_at INTEGER,
      completed_at INTEGER,
      aborted_at INTEGER,
      created_by TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ritual_events (
      id TEXT PRIMARY KEY,
      ritual_id TEXT NOT NULL,
      type TEXT NOT NULL,
      phase TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      parameters TEXT, -- JSON
      effects TEXT, -- JSON
      metadata TEXT, -- JSON
      FOREIGN KEY (ritual_id) REFERENCES rituals(id) ON DELETE CASCADE
    )
  `);

  // Milestone 5: ArchonAI Autonomy tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS archon_proposals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      rationale TEXT NOT NULL,
      predicted_impact TEXT NOT NULL, -- JSON
      actions TEXT NOT NULL, -- JSON array
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      reviewed_by TEXT,
      applied_at INTEGER,
      failure_reason TEXT
    )
  `);

  // Milestone 5: Timeline & Time Travel tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT, -- JSON
      related_snapshot_id TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_snapshots (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      label TEXT,
      fabric_state TEXT NOT NULL, -- JSON
      rituals_state TEXT NOT NULL, -- JSON
      capsules_state TEXT NOT NULL, -- JSON
      shader_state TEXT, -- JSON
      metadata TEXT -- JSON
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_room_members_room_id ON chat_room_members(room_id);
    CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON chat_room_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_room_moderators_room_id ON chat_room_moderators(room_id);
    CREATE INDEX IF NOT EXISTS idx_system_messages_room_id ON system_messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_room_music_queue_room_id ON room_music_queue(room_id);
    -- Milestone 5 indexes
    CREATE INDEX IF NOT EXISTS idx_rituals_phase ON rituals(phase);
    CREATE INDEX IF NOT EXISTS idx_rituals_created_at ON rituals(created_at);
    CREATE INDEX IF NOT EXISTS idx_ritual_events_ritual_id ON ritual_events(ritual_id);
    CREATE INDEX IF NOT EXISTS idx_ritual_events_timestamp ON ritual_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_archon_proposals_status ON archon_proposals(status);
    CREATE INDEX IF NOT EXISTS idx_archon_proposals_created_at ON archon_proposals(created_at);
    CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(type);
    CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_system_snapshots_timestamp ON system_snapshots(timestamp);
  `);

  // Migrations for existing databases
  try {
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN name TEXT`);
  } catch (e: any) {
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }
  try {
    // Make name unique if not already
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_name ON chat_rooms(name) WHERE name IS NOT NULL`);
  } catch (e: any) {
    // Ignore if index already exists
  }
  try {
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN description TEXT`);
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN creator_id INTEGER REFERENCES chat_users(id)`);
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN font_family TEXT DEFAULT 'system-ui'`);
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN font_size INTEGER DEFAULT 14`);
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN rules TEXT`);
    db.exec(`ALTER TABLE chat_rooms ADD COLUMN last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
  } catch (e: any) {
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }
  try {
    db.exec(`ALTER TABLE chat_room_members ADD COLUMN is_moderator INTEGER NOT NULL DEFAULT 0`);
  } catch (e: any) {
    if (!e.message?.includes("duplicate column")) {
      console.warn("Migration warning:", e.message);
    }
  }
}

/**
 * Type definitions for database rows.
 */
export interface ChatUser {
  id: number;
  address: string;
  username: string;
  display_name: string | null;
  is_archon: number; // 0 or 1
  created_at: string;
}

export interface ChatRoom {
  id: number;
  type: string; // 'world' | 'dm' | 'custom'
  slug: string | null;
  name: string | null;
  description: string | null;
  creator_id: number | null;
  font_family: string | null;
  font_size: number | null;
  rules: string | null;
  created_at: string;
}

export interface ChatRoomMember {
  id: number;
  room_id: number;
  user_id: number;
  is_moderator: number; // 0 or 1
  created_at: string;
}

export interface SystemMessage {
  id: number;
  room_id: number;
  content: string;
  interval_seconds: number;
  last_sent_at: string | null;
  is_active: number; // 0 or 1
  created_at: string;
}

export interface RoomMusicItem {
  id: number;
  room_id: number;
  source_type: string; // 'spotify' | 'soundcloud' | 'youtube' | 'nft'
  source_url: string;
  title: string | null;
  artist: string | null;
  position: number;
  is_playing: number; // 0 or 1
  created_at: string;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  nft_id: string | null;
  media_url: string | null;
  media_type: string | null;
  is_blurred: number; // 0 or 1
  created_at: string;
}

/**
 * Helper functions for common queries.
 */
// Developer Registry functions

export function upsertDeveloper(
  address: string,
  username: string,
  reputation: number = 0
): void {
  const db = getDb();
  
  // Check if address already exists
  const existing = getDeveloperByAddress(address);
  
  if (existing) {
    // Update existing record
    const stmt = db.prepare(`
      UPDATE developers
      SET username = ?, reputation = ?
      WHERE address = ?
    `);
    stmt.run(username, reputation, address);
  } else {
    // Insert new record
    const stmt = db.prepare(`
      INSERT INTO developers (address, username, reputation, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(address, username, reputation, Date.now());
  }
}

export function getDeveloperByAddress(address: string): any | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM developers WHERE address = ?");
  const row = stmt.get(address) as any;
  return row || null;
}

export function getDeveloperByUsername(username: string): any | null {
  const db = getDb();
  // Normalize username for lookup (lowercase, trim)
  const normalizedUsername = username.toLowerCase().trim();
  // Get all developers and filter (since SQLite doesn't support LOWER in WHERE easily)
  const stmt = db.prepare("SELECT * FROM developers");
  const allDevs = stmt.all() as any[];
  const dev = allDevs.find(d => (d.username || "").toLowerCase().trim() === normalizedUsername);
  return dev || null;
}

export function listDevelopers(): any[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM developers ORDER BY reputation DESC, created_at DESC");
  return stmt.all() as any[];
}

export function createProject(
  slug: string,
  name: string,
  description: string | null = null
): any {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO projects (slug, name, description, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(slug, name, description, Date.now());
  return getProjectBySlug(slug);
}

export function getProjectBySlug(slug: string): any | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM projects WHERE slug = ?");
  const row = stmt.get(slug) as any;
  return row || null;
}

export function addMaintainer(projectSlug: string, devAddress: string): void {
  const db = getDb();
  const project = getProjectBySlug(projectSlug);
  const developer = getDeveloperByAddress(devAddress);
  
  if (!project || !developer) {
    throw new Error("Project or developer not found");
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO project_maintainers (project_id, developer_id)
    VALUES (?, ?)
  `);
  stmt.run(project.id, developer.id);
}

export function getMaintainers(projectSlug: string): any[] {
  const db = getDb();
  const project = getProjectBySlug(projectSlug);
  if (!project) {
    return [];
  }

  const stmt = db.prepare(`
    SELECT d.* FROM developers d
    INNER JOIN project_maintainers pm ON d.id = pm.developer_id
    WHERE pm.project_id = ?
  `);
  return stmt.all(project.id) as any[];
}

export function listProjects(): any[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM projects ORDER BY created_at DESC");
  return stmt.all() as any[];
}

// Dev Capsules functions

export function upsertDevCapsule(
  id: number,
  ownerAddress: string,
  projectSlug: string,
  status: string,
  createdAt: number,
  updatedAt: number,
  notes: string
): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO dev_capsules (id, owner_address, project_slug, status, created_at, updated_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      owner_address = excluded.owner_address,
      project_slug = excluded.project_slug,
      status = excluded.status,
      updated_at = excluded.updated_at,
      notes = excluded.notes
  `);
  stmt.run(id, ownerAddress, projectSlug, status, createdAt, updatedAt, notes);
}

export function getDevCapsuleById(id: number): any | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM dev_capsules WHERE id = ?");
  const row = stmt.get(id) as any;
  return row || null;
}

export function getDevCapsulesByOwner(ownerAddress: string): any[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM dev_capsules WHERE owner_address = ? ORDER BY created_at DESC");
  return stmt.all(ownerAddress) as any[];
}

export function getDevCapsulesByProject(projectSlug: string): any[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM dev_capsules WHERE project_slug = ? ORDER BY created_at DESC");
  return stmt.all(projectSlug) as any[];
}

export const chatDb = {
  /**
   * Get or create a chat user by address.
   */
  getOrCreateUser(
    address: string,
    username?: string,
    displayName?: string
  ): ChatUser {
    const db = getDb();
    
    // Try to find existing user
    const existing = db
      .prepare("SELECT * FROM chat_users WHERE address = ?")
      .get(address) as ChatUser | undefined;

    if (existing) {
      // Update username if provided and not taken
      if (username && username !== existing.username) {
        const usernameTaken = db
          .prepare("SELECT id FROM chat_users WHERE username = ? AND id != ?")
          .get(username, existing.id);

        if (!usernameTaken) {
          db.prepare(
            "UPDATE chat_users SET username = ?, display_name = COALESCE(?, display_name) WHERE id = ?"
          ).run(username, displayName || null, existing.id);
          
          return db
            .prepare("SELECT * FROM chat_users WHERE id = ?")
            .get(existing.id) as ChatUser;
        }
      }
      return existing;
    }

    // Create new user
    const finalUsername = username || address.slice(0, 16);
    const finalDisplayName = displayName || finalUsername;

    const result = db
      .prepare(
        "INSERT INTO chat_users (address, username, display_name, is_archon) VALUES (?, ?, ?, 0)"
      )
      .run(address, finalUsername, finalDisplayName);

    return db
      .prepare("SELECT * FROM chat_users WHERE id = ?")
      .get(result.lastInsertRowid) as ChatUser;
  },

  /**
   * Get user by username (case-insensitive).
   */
  getUserByUsername(username: string): ChatUser | null {
    const db = getDb();
    return (
      (db
        .prepare("SELECT * FROM chat_users WHERE LOWER(username) = LOWER(?)")
        .get(username) as ChatUser | undefined) || null
    );
  },

  /**
   * Get user by address.
   */
  getUserByAddress(address: string): ChatUser | null {
    const db = getDb();
    return (
      (db
        .prepare("SELECT * FROM chat_users WHERE address = ?")
        .get(address) as ChatUser | undefined) || null
    );
  },

  /**
   * Get user by ID.
   */
  getUserById(userId: number): ChatUser | null {
    const db = getDb();
    return (
      (db.prepare("SELECT * FROM chat_users WHERE id = ?").get(userId) as ChatUser | undefined) || null
    );
  },

  /**
   * Get room by ID.
   */
  getRoomById(roomId: number): ChatRoom | null {
    const db = getDb();
    return (
      (db.prepare("SELECT * FROM chat_rooms WHERE id = ?").get(roomId) as ChatRoom | undefined) || null
    );
  },

  /**
   * Get room by slug.
   */
  getRoomBySlug(slug: string): ChatRoom | null {
    const db = getDb();
    return (
      (db.prepare("SELECT * FROM chat_rooms WHERE slug = ?").get(slug) as ChatRoom | undefined) || null
    );
  },

  /**
   * Get or create the world chat room.
   */
  getOrCreateWorldRoom(): ChatRoom {
    const db = getDb();
    
    let room = db
      .prepare("SELECT * FROM chat_rooms WHERE slug = 'world'")
      .get() as ChatRoom | undefined;

    if (!room) {
      db.prepare(
        "INSERT INTO chat_rooms (type, slug) VALUES ('world', 'world')"
      ).run();
      room = db
        .prepare("SELECT * FROM chat_rooms WHERE slug = 'world'")
        .get() as ChatRoom;
    }

    return room!;
  },

  /**
   * Get or create a DM room between two users.
   */
  getOrCreateDmRoom(userId1: number, userId2: number): ChatRoom {
    const db = getDb();
    
    // Get addresses for slug generation
    const user1 = db
      .prepare("SELECT address FROM chat_users WHERE id = ?")
      .get(userId1) as { address: string } | undefined;
    const user2 = db
      .prepare("SELECT address FROM chat_users WHERE id = ?")
      .get(userId2) as { address: string } | undefined;

    if (!user1 || !user2) {
      throw new Error("One or both users not found");
    }

    // Create canonical slug (sorted addresses)
    const addresses = [user1.address, user2.address].sort();
    const slug = `dm:${addresses[0]}:${addresses[1]}`;

    let room = db
      .prepare("SELECT * FROM chat_rooms WHERE slug = ?")
      .get(slug) as ChatRoom | undefined;

    if (!room) {
      db.prepare(
        "INSERT INTO chat_rooms (type, slug) VALUES ('dm', ?)"
      ).run(slug);
      room = db
        .prepare("SELECT * FROM chat_rooms WHERE slug = ?")
        .get(slug) as ChatRoom;
    }

    // Ensure both users are members
    db.prepare(
      "INSERT OR IGNORE INTO chat_room_members (room_id, user_id) VALUES (?, ?)"
    ).run(room!.id, userId1);
    db.prepare(
      "INSERT OR IGNORE INTO chat_room_members (room_id, user_id) VALUES (?, ?)"
    ).run(room!.id, userId2);

    return room!;
  },

  /**
   * Get DM rooms for a user.
   */
  getDmRoomsForUser(userId: number): ChatRoom[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT DISTINCT r.*
        FROM chat_rooms r
        INNER JOIN chat_room_members m ON r.id = m.room_id
        WHERE r.type = 'dm' AND m.user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(userId) as ChatRoom[];
  },

  /**
   * Get members of a room.
   */
  getRoomMembers(roomId: number): ChatUser[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT u.*
        FROM chat_users u
        INNER JOIN chat_room_members m ON u.id = m.user_id
        WHERE m.room_id = ?
      `)
      .all(roomId) as ChatUser[];
  },

  /**
   * Get messages for a room (paginated).
   */
  getRoomMessages(
    roomId: number,
    limit: number = 50,
    beforeId?: number
  ): ChatMessage[] {
    const db = getDb();
    
    if (beforeId) {
      return db
        .prepare(`
          SELECT * FROM chat_messages
          WHERE room_id = ? AND id < ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .all(roomId, beforeId, limit) as ChatMessage[];
    } else {
      return db
        .prepare(`
          SELECT * FROM chat_messages
          WHERE room_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .all(roomId, limit) as ChatMessage[];
    }
  },

  /**
   * Get last message in a room.
   */
  getLastMessage(roomId: number): ChatMessage | null {
    const db = getDb();
    return (
      (db
        .prepare(`
          SELECT * FROM chat_messages
          WHERE room_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `)
        .get(roomId) as ChatMessage | undefined) || null
    );
  },

  /**
   * Create a new message.
   */
  createMessage(
    roomId: number,
    senderId: number,
    content: string,
    nftId?: string | null,
    mediaUrl?: string | null,
    mediaType?: string | null
  ): ChatMessage {
    const db = getDb();
    // Update room activity when message is created
    this.updateRoomActivity(roomId);
    
    const result = db
      .prepare(
        "INSERT INTO chat_messages (room_id, sender_id, content, nft_id, media_url, media_type) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(roomId, senderId, content, nftId || null, mediaUrl || null, mediaType || null);

    return db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(result.lastInsertRowid) as ChatMessage;
  },

  /**
   * Check if user is member of room (world room is implicit).
   */
  isRoomMember(roomId: number, userId: number): boolean {
    const db = getDb();
    
    // World room is open to all
    const room = db
      .prepare("SELECT type FROM chat_rooms WHERE id = ?")
      .get(roomId) as { type: string } | undefined;
    
    if (room?.type === "world") {
      return true;
    }

    const member = db
      .prepare(
        "SELECT id FROM chat_room_members WHERE room_id = ? AND user_id = ?"
      )
      .get(roomId, userId);

    return !!member;
  },

  /**
   * Blur media in a message (safety feature - any user can blur media for everyone).
   */
  blurMessage(messageId: number): ChatMessage | null {
    const db = getDb();
    const message = db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(messageId) as ChatMessage | undefined;

    if (!message) {
      return null;
    }

    // Only blur if message has media
    if (!message.media_url) {
      return null;
    }

    // Update the message to be blurred
    db.prepare("UPDATE chat_messages SET is_blurred = 1 WHERE id = ?").run(messageId);

    return db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(messageId) as ChatMessage;
  },

  /**
   * Create a custom room.
   */
  createCustomRoom(
    name: string,
    description: string | null,
    creatorId: number,
    slug: string
  ): ChatRoom {
    const db = getDb();
    
    // Check if name is already taken
    if (!this.isRoomNameAvailable(name)) {
      throw new Error(`Room name "${name}" is already taken`);
    }
    
    const result = db
      .prepare(
        "INSERT INTO chat_rooms (type, name, description, creator_id, slug, last_activity) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
      )
      .run("custom", name, description, creatorId, slug);
    
    const room = db
      .prepare("SELECT * FROM chat_rooms WHERE id = ?")
      .get(result.lastInsertRowid) as ChatRoom;
    
    // Add creator as member and moderator
    db.prepare(
      "INSERT INTO chat_room_members (room_id, user_id, is_moderator) VALUES (?, ?, 1)"
    ).run(room.id, creatorId);
    
    db.prepare(
      "INSERT INTO chat_room_moderators (room_id, user_id) VALUES (?, ?)"
    ).run(room.id, creatorId);
    
    return room;
  },

  /**
   * Leave a custom room (remove user from room members).
   */
  leaveCustomRoom(roomId: number, userId: number): boolean {
    const db = getDb();
    const room = db.prepare("SELECT type FROM chat_rooms WHERE id = ?").get(roomId) as { type: string } | undefined;
    if (!room || room.type !== "custom") {
      return false;
    }
    
    // Remove from members
    db.prepare("DELETE FROM chat_room_members WHERE room_id = ? AND user_id = ?").run(roomId, userId);
    
    // Also remove from moderators if they were one
    db.prepare("DELETE FROM chat_room_moderators WHERE room_id = ? AND user_id = ?").run(roomId, userId);
    
    return true;
  },

  /**
   * Get custom rooms for a user (rooms they're a member of).
   */
  getCustomRoomsForUser(userId: number): ChatRoom[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT DISTINCT r.*
        FROM chat_rooms r
        INNER JOIN chat_room_members m ON r.id = m.room_id
        WHERE r.type = 'custom' AND m.user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(userId) as ChatRoom[];
  },

  /**
   * Get all custom rooms (public listing).
   */
  getAllCustomRooms(): ChatRoom[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT * FROM chat_rooms
        WHERE type = 'custom'
        ORDER BY created_at DESC
      `)
      .all() as ChatRoom[];
  },

  /**
   * Check if user is moderator of a room.
   */
  isRoomModerator(roomId: number, userId: number): boolean {
    const db = getDb();
    const result = db
      .prepare(
        "SELECT 1 FROM chat_room_moderators WHERE room_id = ? AND user_id = ?"
      )
      .get(roomId, userId);
    return !!result;
  },

  /**
   * Add a moderator to a room.
   */
  addRoomModerator(roomId: number, userId: number): void {
    const db = getDb();
    // Add to moderators table
    try {
      db.prepare(
        "INSERT INTO chat_room_moderators (room_id, user_id) VALUES (?, ?)"
      ).run(roomId, userId);
    } catch (e: any) {
      // Already a moderator, ignore
      if (!e.message?.includes("UNIQUE constraint")) {
        throw e;
      }
    }
    // Update member record
    db.prepare(
      "UPDATE chat_room_members SET is_moderator = 1 WHERE room_id = ? AND user_id = ?"
    ).run(roomId, userId);
  },

  /**
   * Remove a moderator from a room.
   */
  removeRoomModerator(roomId: number, userId: number): void {
    const db = getDb();
    db.prepare(
      "DELETE FROM chat_room_moderators WHERE room_id = ? AND user_id = ?"
    ).run(roomId, userId);
    db.prepare(
      "UPDATE chat_room_members SET is_moderator = 0 WHERE room_id = ? AND user_id = ?"
    ).run(roomId, userId);
  },

  /**
   * Get moderators of a room.
   */
  getRoomModerators(roomId: number): ChatUser[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT u.*
        FROM chat_users u
        INNER JOIN chat_room_moderators m ON u.id = m.user_id
        WHERE m.room_id = ?
      `)
      .all(roomId) as ChatUser[];
  },

  /**
   * Update room settings.
   */
  updateRoomSettings(
    roomId: number,
    settings: {
      name?: string;
      description?: string;
      fontFamily?: string;
      fontSize?: number;
      rules?: string;
    }
  ): void {
    const db = getDb();
    const updates: string[] = [];
    const values: any[] = [];
    
    if (settings.name !== undefined) {
      updates.push("name = ?");
      values.push(settings.name);
    }
    if (settings.description !== undefined) {
      updates.push("description = ?");
      values.push(settings.description);
    }
    if (settings.fontFamily !== undefined) {
      updates.push("font_family = ?");
      values.push(settings.fontFamily);
    }
    if (settings.fontSize !== undefined) {
      updates.push("font_size = ?");
      values.push(settings.fontSize);
    }
    if (settings.rules !== undefined) {
      updates.push("rules = ?");
      values.push(settings.rules);
    }
    
    if (updates.length > 0) {
      values.push(roomId);
      db.prepare(
        `UPDATE chat_rooms SET ${updates.join(", ")} WHERE id = ?`
      ).run(...values);
    }
  },

  /**
   * Create a system message.
   */
  createSystemMessage(
    roomId: number,
    content: string,
    intervalSeconds: number = 3600
  ): SystemMessage {
    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO system_messages (room_id, content, interval_seconds) VALUES (?, ?, ?)"
      )
      .run(roomId, content, intervalSeconds);
    
    return db
      .prepare("SELECT * FROM system_messages WHERE id = ?")
      .get(result.lastInsertRowid) as SystemMessage;
  },

  /**
   * Get system messages for a room.
   */
  getSystemMessages(roomId: number): SystemMessage[] {
    const db = getDb();
    return db
      .prepare(
        "SELECT * FROM system_messages WHERE room_id = ? AND is_active = 1 ORDER BY created_at DESC"
      )
      .all(roomId) as SystemMessage[];
  },

  /**
   * Update system message last sent time.
   */
  updateSystemMessageLastSent(messageId: number): void {
    const db = getDb();
    db.prepare(
      "UPDATE system_messages SET last_sent_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(messageId);
  },

  /**
   * Add music item to room queue.
   */
  addMusicToQueue(
    roomId: number,
    sourceType: string,
    sourceUrl: string,
    title?: string,
    artist?: string
  ): RoomMusicItem {
    const db = getDb();
    // Get max position
    const maxPos = db
      .prepare("SELECT COALESCE(MAX(position), 0) as max FROM room_music_queue WHERE room_id = ?")
      .get(roomId) as { max: number } | undefined;
    
    const position = (maxPos?.max || 0) + 1;
    
    const result = db
      .prepare(
        "INSERT INTO room_music_queue (room_id, source_type, source_url, title, artist, position) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(roomId, sourceType, sourceUrl, title || null, artist || null, position);
    
    return db
      .prepare("SELECT * FROM room_music_queue WHERE id = ?")
      .get(result.lastInsertRowid) as RoomMusicItem;
  },

  /**
   * Get music queue for a room.
   */
  getRoomMusicQueue(roomId: number): RoomMusicItem[] {
    const db = getDb();
    return db
      .prepare(
        "SELECT * FROM room_music_queue WHERE room_id = ? ORDER BY position ASC"
      )
      .all(roomId) as RoomMusicItem[];
  },

  /**
   * Set currently playing music.
   */
  setPlayingMusic(roomId: number, musicId: number | null): void {
    const db = getDb();
    // Clear all playing flags for this room
    db.prepare("UPDATE room_music_queue SET is_playing = 0 WHERE room_id = ?").run(roomId);
    // Set the new playing item
    if (musicId !== null) {
      db.prepare("UPDATE room_music_queue SET is_playing = 1 WHERE id = ? AND room_id = ?").run(musicId, roomId);
    }
  },

  /**
   * Update room's last activity timestamp.
   */
  updateRoomActivity(roomId: number): void {
    const db = getDb();
    db.prepare("UPDATE chat_rooms SET last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(roomId);
  },

  /**
   * Check if room name is available (unique).
   */
  isRoomNameAvailable(name: string): boolean {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM chat_rooms WHERE name = ?").get(name);
    return !existing;
  },

  /**
   * Delete a custom room (cascade deletes members, messages, etc.).
   */
  deleteCustomRoom(roomId: number): boolean {
    const db = getDb();
    const room = db.prepare("SELECT type FROM chat_rooms WHERE id = ?").get(roomId) as { type: string } | undefined;
    if (!room || room.type !== "custom") {
      return false;
    }
    db.prepare("DELETE FROM chat_rooms WHERE id = ?").run(roomId);
    return true;
  },

  /**
   * Get active users currently in a room (users who have sent messages in last 5 minutes).
   */
  getActiveUsersInRoom(roomId: number): ChatUser[] {
    const db = getDb();
    return db
      .prepare(`
        SELECT DISTINCT u.*
        FROM chat_users u
        INNER JOIN chat_messages m ON m.sender_id = u.id
        WHERE m.room_id = ? 
          AND m.created_at > datetime('now', '-5 minutes')
        ORDER BY m.created_at DESC
      `)
      .all(roomId) as ChatUser[];
  },

  /**
   * Get chat analytics for a user by address.
   */
  getUserChatAnalytics(address: string): {
    totalMessages: number;
    worldChatMessages: number;
    dmMessages: number;
    customRoomMessages: number;
    roomsCreated: number;
    roomsModerated: number;
    mediaShared: number;
    firstMessageAt: string | null;
    lastMessageAt: string | null;
  } {
    const db = getDb();
    const user = this.getUserByAddress(address);
    if (!user) {
      return {
        totalMessages: 0,
        worldChatMessages: 0,
        dmMessages: 0,
        customRoomMessages: 0,
        roomsCreated: 0,
        roomsModerated: 0,
        mediaShared: 0,
        firstMessageAt: null,
        lastMessageAt: null,
      };
    }

    // Get world room ID
    const worldRoom = db.prepare("SELECT id FROM chat_rooms WHERE slug = 'world'").get() as { id: number } | undefined;
    const worldRoomId = worldRoom?.id || 0;

    // Count messages by room type
    const stats = db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN room_id = ? THEN 1 ELSE 0 END) as world,
          SUM(CASE WHEN r.type = 'dm' THEN 1 ELSE 0 END) as dm,
          SUM(CASE WHEN r.type = 'custom' THEN 1 ELSE 0 END) as custom,
          SUM(CASE WHEN media_url IS NOT NULL THEN 1 ELSE 0 END) as media,
          MIN(m.created_at) as first_msg,
          MAX(m.created_at) as last_msg
        FROM chat_messages m
        INNER JOIN chat_rooms r ON m.room_id = r.id
        WHERE m.sender_id = ?
      `)
      .get(worldRoomId, user.id) as {
        total: number;
        world: number;
        dm: number;
        custom: number;
        media: number;
        first_msg: string | null;
        last_msg: string | null;
      } | undefined;

    // Count rooms created
    const roomsCreated = db
      .prepare("SELECT COUNT(*) as count FROM chat_rooms WHERE creator_id = ? AND type = 'custom'")
      .get(user.id) as { count: number } | undefined;

    // Count rooms moderated
    const roomsModerated = db
      .prepare("SELECT COUNT(DISTINCT room_id) as count FROM chat_room_moderators WHERE user_id = ?")
      .get(user.id) as { count: number } | undefined;

    return {
      totalMessages: stats?.total || 0,
      worldChatMessages: stats?.world || 0,
      dmMessages: stats?.dm || 0,
      customRoomMessages: stats?.custom || 0,
      roomsCreated: roomsCreated?.count || 0,
      roomsModerated: roomsModerated?.count || 0,
      mediaShared: stats?.media || 0,
      firstMessageAt: stats?.first_msg || null,
      lastMessageAt: stats?.last_msg || null,
    };
  },

  /**
   * Get message activity over time for a user (last 30 days, grouped by day).
   */
  getUserMessageActivity(address: string): Array<{ date: string; count: number }> {
    const db = getDb();
    const user = this.getUserByAddress(address);
    if (!user) {
      return [];
    }

    const activity = db
      .prepare(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM chat_messages
        WHERE sender_id = ? 
          AND created_at > datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
      .all(user.id) as Array<{ date: string; count: number }>;

    return activity;
  },

  /**
   * Clean up inactive/empty custom rooms (no messages for 20 minutes or no members).
   */
  cleanupInactiveRooms(): number {
    const db = getDb();
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    
    // Find rooms with no activity in last 20 minutes or no members
    const inactiveRooms = db
      .prepare(`
        SELECT r.id
        FROM chat_rooms r
        WHERE r.type = 'custom'
          AND (
            r.last_activity < ? OR
            NOT EXISTS (
              SELECT 1 FROM chat_room_members WHERE room_id = r.id
            )
          )
      `)
      .all(twentyMinutesAgo) as { id: number }[];
    
    let deleted = 0;
    for (const room of inactiveRooms) {
      if (this.deleteCustomRoom(room.id)) {
        deleted++;
      }
    }
    
    return deleted;
  },

  /**
   * Remove music from queue.
   */
  removeMusicFromQueue(musicId: number): void {
    const db = getDb();
    db.prepare("DELETE FROM room_music_queue WHERE id = ?").run(musicId);
  },
};

// Milestone 5: Ritual Engine database functions
export function createRitual(
  id: string,
  name: string,
  description: string | null,
  parameters: string, // JSON string
  effects: string | null, // JSON string
  createdBy: string | null
): any {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO rituals (id, name, description, parameters, phase, effects, created_by, created_at)
    VALUES (?, ?, ?, ?, 'idle', ?, ?, ?)
  `).run(id, name, description || null, parameters, effects || null, createdBy || null, now);
  return getRitualById(id);
}

export function getRitualById(id: string): any | null {
  const db = getDb();
  return db.prepare("SELECT * FROM rituals WHERE id = ?").get(id) as any | null;
}

export function getRituals(phase?: string): any[] {
  const db = getDb();
  if (phase) {
    return db.prepare("SELECT * FROM rituals WHERE phase = ? ORDER BY created_at DESC").all(phase) as any[];
  }
  return db.prepare("SELECT * FROM rituals ORDER BY created_at DESC").all() as any[];
}

export function updateRitualPhase(
  id: string,
  phase: string,
  parameters?: string,
  effects?: string
): any {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];
  
  updates.push("phase = ?");
  values.push(phase);
  
  if (parameters !== undefined) {
    updates.push("parameters = ?");
    values.push(parameters);
  }
  
  if (effects !== undefined) {
    updates.push("effects = ?");
    values.push(effects);
  }
  
  if (phase === "active" || phase === "initiating") {
    updates.push("started_at = COALESCE(started_at, ?)");
    values.push(Date.now());
  } else if (phase === "completed") {
    updates.push("completed_at = ?");
    values.push(Date.now());
  } else if (phase === "aborted") {
    updates.push("aborted_at = ?");
    values.push(Date.now());
  }
  
  values.push(id);
  db.prepare(`UPDATE rituals SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  return getRitualById(id);
}

export function createRitualEvent(
  id: string,
  ritualId: string,
  type: string,
  phase: string,
  parameters?: string,
  effects?: string,
  metadata?: string
): any {
  const db = getDb();
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO ritual_events (id, ritual_id, type, phase, timestamp, parameters, effects, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ritualId, type, phase, timestamp, parameters || null, effects || null, metadata || null);
  return db.prepare("SELECT * FROM ritual_events WHERE id = ?").get(id) as any;
}

export function getRitualEvents(ritualId: string, limit: number = 50): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ritual_events 
    WHERE ritual_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(ritualId, limit) as any[];
}

// Milestone 5: ArchonAI database functions
export function createArchonProposal(
  id: string,
  title: string,
  rationale: string,
  predictedImpact: string, // JSON string
  actions: string // JSON string
): any {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO archon_proposals (id, title, rationale, predicted_impact, actions, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, title, rationale, predictedImpact, actions, now);
  return getArchonProposalById(id);
}

export function getArchonProposalById(id: string): any | null {
  const db = getDb();
  return db.prepare("SELECT * FROM archon_proposals WHERE id = ?").get(id) as any | null;
}

export function getArchonProposals(status?: string, limit: number = 50): any[] {
  const db = getDb();
  if (status) {
    return db.prepare(`
      SELECT * FROM archon_proposals 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(status, limit) as any[];
  }
  return db.prepare(`
    SELECT * FROM archon_proposals 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(limit) as any[];
}

export function reviewArchonProposal(
  id: string,
  status: string,
  reviewedBy: string
): any {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    UPDATE archon_proposals 
    SET status = ?, reviewed_at = ?, reviewed_by = ?
    WHERE id = ?
  `).run(status, now, reviewedBy, id);
  return getArchonProposalById(id);
}

export function applyArchonProposal(id: string): any {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    UPDATE archon_proposals 
    SET status = 'applied', applied_at = ?
    WHERE id = ?
  `).run(now, id);
  return getArchonProposalById(id);
}

// Milestone 5: Timeline database functions
export function createSystemEvent(
  id: string,
  type: string,
  source: string,
  title: string,
  description: string,
  metadata?: string,
  relatedSnapshotId?: string
): any {
  const db = getDb();
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO system_events (id, type, source, title, description, timestamp, metadata, related_snapshot_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, source, title, description, timestamp, metadata || null, relatedSnapshotId || null);
  return db.prepare("SELECT * FROM system_events WHERE id = ?").get(id) as any;
}

export function getSystemEvents(
  type?: string,
  source?: string,
  startTime?: number,
  endTime?: number,
  limit: number = 50,
  offset: number = 0
): any[] {
  const db = getDb();
  let query = "SELECT * FROM system_events WHERE 1=1";
  const params: any[] = [];
  
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }
  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  if (startTime) {
    query += " AND timestamp >= ?";
    params.push(startTime);
  }
  if (endTime) {
    query += " AND timestamp <= ?";
    params.push(endTime);
  }
  
  query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  return db.prepare(query).all(...params) as any[];
}

export function createSystemSnapshot(
  id: string,
  label: string | null,
  fabricState: string, // JSON string
  ritualsState: string, // JSON string
  capsulesState: string, // JSON string
  shaderState?: string, // JSON string
  metadata?: string // JSON string
): any {
  const db = getDb();
  const timestamp = Date.now();
  db.prepare(`
    INSERT INTO system_snapshots (id, timestamp, label, fabric_state, rituals_state, capsules_state, shader_state, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, timestamp, label || null, fabricState, ritualsState, capsulesState, shaderState || null, metadata || null);
  return getSystemSnapshotById(id);
}

export function getSystemSnapshotById(id: string): any | null {
  const db = getDb();
  return db.prepare("SELECT * FROM system_snapshots WHERE id = ?").get(id) as any | null;
}

export function getSystemSnapshots(
  startTime?: number,
  endTime?: number,
  limit: number = 50,
  offset: number = 0
): any[] {
  const db = getDb();
  let query = "SELECT * FROM system_snapshots WHERE 1=1";
  const params: any[] = [];
  
  if (startTime) {
    query += " AND timestamp >= ?";
    params.push(startTime);
  }
  if (endTime) {
    query += " AND timestamp <= ?";
    params.push(endTime);
  }
  
  query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  return db.prepare(query).all(...params) as any[];
}

