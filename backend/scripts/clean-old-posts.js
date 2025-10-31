const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Clean old posts with timestamp-based IDs (too large numbers)
 * Blockchain post IDs are sequential: 1, 2, 3...
 * Database timestamp IDs are huge: 1730856665, etc.
 * 
 * This script removes posts with ID > 1000000 (clearly timestamps)
 */

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

console.log('🗑️  Cleaning old posts from database...');
console.log('📁 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  // Find posts with timestamp-based IDs
  db.all('SELECT post_id, author_address, created_at FROM posts WHERE post_id > 1000000', (err, posts) => {
    if (err) {
      console.error('❌ Error querying posts:', err);
      db.close();
      return;
    }

    console.log(`\n📊 Found ${posts.length} posts with timestamp-based IDs`);
    
    if (posts.length === 0) {
      console.log('✅ No old posts to clean!');
      db.close();
      return;
    }

    posts.forEach((post, i) => {
      console.log(`${i + 1}. Post ID: ${post.post_id} by ${post.author_address.slice(0, 8)}...`);
    });

    console.log('\n🗑️  Deleting old posts...');

    // Delete related data first (foreign keys)
    db.run('DELETE FROM likes WHERE post_id > 1000000', (err) => {
      if (err) console.error('⚠️  Error deleting likes:', err);
      else console.log('✅ Deleted likes for old posts');
    });

    db.run('DELETE FROM comments WHERE post_id > 1000000', (err) => {
      if (err) console.error('⚠️  Error deleting comments:', err);
      else console.log('✅ Deleted comments for old posts');
    });

    db.run('DELETE FROM shares WHERE original_post_id > 1000000 OR new_post_id > 1000000', (err) => {
      if (err) console.error('⚠️  Error deleting shares:', err);
      else console.log('✅ Deleted shares for old posts');
    });

    // Delete the posts
    db.run('DELETE FROM posts WHERE post_id > 1000000', function(err) {
      if (err) {
        console.error('❌ Error deleting posts:', err);
      } else {
        console.log(`✅ Deleted ${this.changes} posts`);
        console.log('\n🎉 Database cleaned successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Restart your backend server');
        console.log('2. Create NEW posts (they will get proper blockchain IDs: 1, 2, 3...)');
        console.log('3. Like, comment, share will work on new posts! 🚀');
      }
      
      db.close();
    });
  });
});
