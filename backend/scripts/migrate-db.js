const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function migrateDatabase() {
  console.log('🔧 Starting database migration...');
  
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log('📦 Connected to database');

  try {
    // Check if header_url column exists
    const tableInfo = await db.all("PRAGMA table_info(users)");
    const hasHeaderUrl = tableInfo.some(col => col.name === 'header_url');

    if (!hasHeaderUrl) {
      console.log('➕ Adding header_url column...');
      await db.exec(`ALTER TABLE users ADD COLUMN header_url TEXT`);
      console.log('✅ header_url column added successfully!');
    } else {
      console.log('✅ header_url column already exists');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

migrateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
