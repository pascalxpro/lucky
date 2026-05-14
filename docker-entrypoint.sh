#!/bin/sh
# Initialize DB if empty (0 bytes)
DB_FILE="/app/prisma/dev.db"
if [ ! -s "$DB_FILE" ]; then
  echo "📦 Initializing database..."
  node -e "
    const Database = require('better-sqlite3');
    const db = new Database('$DB_FILE');
    db.exec(\`
      CREATE TABLE IF NOT EXISTS Campaign (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, gameMode TEXT DEFAULT 'wheel', isActive INTEGER DEFAULT 1, createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS Project (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, name TEXT NOT NULL, description TEXT, imageUrl TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')), FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS Vote (id TEXT PRIMARY KEY, projectId TEXT NOT NULL, campaignId TEXT NOT NULL, deviceId TEXT NOT NULL, ipAddress TEXT, createdAt TEXT DEFAULT (datetime('now')), FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE, FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE);
      CREATE UNIQUE INDEX IF NOT EXISTS Vote_projectId_deviceId_key ON Vote(projectId, deviceId);
      CREATE TABLE IF NOT EXISTS Prize (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, name TEXT NOT NULL, imageUrl TEXT, totalStock INTEGER NOT NULL, remaining INTEGER NOT NULL, probability REAL NOT NULL, isConsolation INTEGER DEFAULT 0, requireClaimInfo INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')), FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS Winner (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, prizeId TEXT NOT NULL, deviceId TEXT NOT NULL, userName TEXT, phone TEXT, address TEXT, status TEXT DEFAULT 'pending', createdAt TEXT DEFAULT (datetime('now')), FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE, FOREIGN KEY (prizeId) REFERENCES Prize(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS Banner (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, imageUrl TEXT NOT NULL, linkUrl TEXT, sortOrder INTEGER DEFAULT 0, FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS Setting (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, FOREIGN KEY (campaignId) REFERENCES Campaign(id) ON DELETE CASCADE);
      CREATE UNIQUE INDEX IF NOT EXISTS Setting_campaignId_key_key ON Setting(campaignId, key);
      CREATE TABLE IF NOT EXISTS AdminUser (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS PageView (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, type TEXT NOT NULL, targetId TEXT, deviceId TEXT NOT NULL, ipAddress TEXT, createdAt TEXT DEFAULT (datetime('now')));
    \`);
    db.close();
    console.log('✅ Tables created');
  "
  echo "🌱 Seeding data..."
  node -e "
    const Database = require('better-sqlite3');
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const db = new Database('$DB_FILE');
    const uid = () => crypto.randomUUID();
    const hash = bcrypt.hashSync('admin1234', 10);
    // Admin
    db.prepare('INSERT OR IGNORE INTO AdminUser (id, username, passwordHash) VALUES (?, ?, ?)').run(uid(), 'admin', hash);
    // Campaign
    db.prepare('INSERT OR IGNORE INTO Campaign (id, name, description, gameMode, isActive) VALUES (?, ?, ?, ?, 1)').run('demo-campaign', '2026 年度人氣票選活動', '選出您最喜愛的作品，投票即可參加幸運抽獎！', 'wheel');
    // Projects
    const projects = [['proj-1','星空幻境','夢幻般的星空藝術創作',1],['proj-2','海洋之心','深海靈感的立體裝置藝術',2],['proj-3','城市脈動','捕捉都市生活的節奏與能量',3],['proj-4','花語呢喃','花卉主題的水彩創作',4],['proj-5','光影交織','光與影的實驗性攝影作品',5],['proj-6','機械詩篇','結合機械與藝術的動態雕塑',6]];
    const pStmt = db.prepare('INSERT OR IGNORE INTO Project (id, campaignId, name, description, sortOrder) VALUES (?, ?, ?, ?, ?)');
    projects.forEach(p => pStmt.run(p[0], 'demo-campaign', p[1], p[2], p[3]));
    // Prizes
    const prizes = [['prize-1','iPhone 16 Pro',0.02,1,1,1,0],['prize-2','AirPods Pro',0.05,3,3,2,0],['prize-3','星巴克禮券 \$500',0.1,10,10,3,0],['prize-4','精美小禮物',0.15,50,50,4,0],['prize-c','感謝參與',0.68,9999,9999,99,1]];
    const prStmt = db.prepare('INSERT OR IGNORE INTO Prize (id, campaignId, name, probability, totalStock, remaining, sortOrder, isConsolation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    prizes.forEach(p => prStmt.run(p[0], 'demo-campaign', p[1], p[2], p[3], p[4], p[5], p[6]));
    db.close();
    console.log('✅ Seed data inserted');
  "
fi

# ── Schema migration: add 'images' column if missing ──
node -e "
  const Database = require('better-sqlite3');
  const db = new Database('$DB_FILE');
  const cols = db.pragma('table_info(Project)').map(c => c.name);
  if (!cols.includes('images')) {
    db.exec('ALTER TABLE Project ADD COLUMN images TEXT');
    console.log('✅ Added images column to Project');
  }
  // Add requireClaimInfo to Prize if missing
  const prizeCols = db.pragma('table_info(Prize)').map(c => c.name);
  if (!prizeCols.includes('requireClaimInfo')) {
    db.exec('ALTER TABLE Prize ADD COLUMN requireClaimInfo INTEGER DEFAULT 1');
    console.log('✅ Added requireClaimInfo column to Prize');
  }
  // Create PageView table if missing
  const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='PageView'\").all();
  if (tables.length === 0) {
    db.exec('CREATE TABLE PageView (id TEXT PRIMARY KEY, campaignId TEXT NOT NULL, type TEXT NOT NULL, targetId TEXT, deviceId TEXT NOT NULL, ipAddress TEXT, createdAt TEXT DEFAULT (datetime(\'now\')))');
    console.log('✅ Created PageView table');
  }
  db.close();
"

exec node server.js
