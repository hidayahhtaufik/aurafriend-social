const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('../utils/logger');

let db = null;

async function initDatabase() {
  try {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    logger.info('📦 Opening database connection...');

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        address TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        profile_hash TEXT,
        bio TEXT,
        avatar_url TEXT,
        header_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL UNIQUE,
        author_address TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        content_text TEXT,
        media_urls TEXT,
        transaction_hash TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (author_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_address TEXT NOT NULL,
        transaction_hash TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(post_id, user_address),
        FOREIGN KEY (post_id) REFERENCES posts(post_id),
        FOREIGN KEY (user_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment_id INTEGER NOT NULL UNIQUE,
        post_id INTEGER NOT NULL,
        user_address TEXT NOT NULL,
        comment_hash TEXT NOT NULL,
        comment_text TEXT,
        transaction_hash TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (post_id) REFERENCES posts(post_id),
        FOREIGN KEY (user_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_address TEXT NOT NULL,
        following_address TEXT NOT NULL,
        transaction_hash TEXT,
        created_at INTEGER NOT NULL,
        UNIQUE(follower_address, following_address),
        FOREIGN KEY (follower_address) REFERENCES users(address),
        FOREIGN KEY (following_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        transaction_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (from_address) REFERENCES users(address),
        FOREIGN KEY (to_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_post_id INTEGER NOT NULL,
        new_post_id INTEGER NOT NULL,
        user_address TEXT NOT NULL,
        transaction_hash TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (original_post_id) REFERENCES posts(post_id),
        FOREIGN KEY (new_post_id) REFERENCES posts(post_id),
        FOREIGN KEY (user_address) REFERENCES users(address)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        type TEXT NOT NULL,
        from_address TEXT NOT NULL,
        post_id INTEGER,
        comment_id INTEGER,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_address) REFERENCES users(address),
        FOREIGN KEY (from_address) REFERENCES users(address)
      );

      CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_address);
      CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_address);
      CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_address);
      CREATE INDEX IF NOT EXISTS idx_tips_to ON tips(to_address);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
    `);

    logger.info('✅ Database tables created/verified');
    return db;
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase,
};
