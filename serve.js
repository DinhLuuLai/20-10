// serve.js - High-performance Web & SQLite Database Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');
const BACKUP_JSON_FILE = path.join(__dirname, 'database_backup.json');
const DEFAULT_DATA_FILE = path.join(__dirname, 'default_data.json');

// =============================================================================
// 1. KHỞI TẠO CƠ SỞ DỮ LIỆU SQLITE (NATIVE NODE.JS SQLITE DATABASE)
// =============================================================================
let db = null;
let dbEngine = 'sqlite';

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_FILE);

  // Tạo các bảng dữ liệu
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS guest_wishes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shared_pages (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      config_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      views INTEGER DEFAULT 0
    );
  `);

  // Kiểm tra nếu chưa có dữ liệu trong DB -> nạp từ default_data.json
  const checkStmt = db.prepare("SELECT data FROM system_config WHERE id = 'main_config'");
  const existing = checkStmt.get();

  if (!existing) {
    let initialData = {};
    if (fs.existsSync(DEFAULT_DATA_FILE)) {
      try {
        initialData = JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf8'));
      } catch (e) {
        console.error('Error reading default_data.json:', e);
      }
    }
    const insertStmt = db.prepare(
      "INSERT INTO system_config (id, data, updated_at) VALUES ('main_config', ?, ?)"
    );
    insertStmt.run(JSON.stringify(initialData), new Date().toISOString());
    console.log('✅ [SQLite DB] Khởi tạo dữ liệu mặc định thành công vào database.sqlite!');
  } else {
    console.log('✅ [SQLite DB] Đã kết nối cơ sở dữ liệu database.sqlite thành công!');
  }
} catch (err) {
  console.warn('⚠️ [DB Warning] Native SQLite không khả dụng, chuyển sang chế độ JSON Database:', err.message);
  dbEngine = 'json-file';
}

// Helper lấy cấu hình từ DB
function getConfigFromDb() {
  if (db) {
    try {
      const stmt = db.prepare("SELECT data, updated_at FROM system_config WHERE id = 'main_config'");
      const row = stmt.get();
      if (row && row.data) {
        return {
          data: JSON.parse(row.data),
          updatedAt: row.updated_at,
          engine: 'sqlite'
        };
      }
    } catch (e) {
      console.error('Error querying SQLite:', e);
    }
  }

  // Fallback đọc từ backup json hoặc default json
  if (fs.existsSync(BACKUP_JSON_FILE)) {
    try {
      return {
        data: JSON.parse(fs.readFileSync(BACKUP_JSON_FILE, 'utf8')),
        updatedAt: fs.statSync(BACKUP_JSON_FILE).mtime.toISOString(),
        engine: 'json-fallback'
      };
    } catch (e) {}
  }

  if (fs.existsSync(DEFAULT_DATA_FILE)) {
    try {
      return {
        data: JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf8')),
        updatedAt: new Date().toISOString(),
        engine: 'default'
      };
    } catch (e) {}
  }

  return { data: {}, updatedAt: new Date().toISOString(), engine: 'empty' };
}

// Helper lưu cấu hình vào DB
function saveConfigToDb(newConfigData) {
  const now = new Date().toISOString();
  const jsonStr = JSON.stringify(newConfigData);

  // 1. Lưu vào SQLite
  if (db) {
    try {
      const stmt = db.prepare(
        "INSERT OR REPLACE INTO system_config (id, data, updated_at) VALUES ('main_config', ?, ?)"
      );
      stmt.run(jsonStr, now);

      // Ghi log vào audit_logs
      try {
        const logStmt = db.prepare(
          "INSERT INTO audit_logs (action, details, created_at) VALUES (?, ?, ?)"
        );
        logStmt.run('UPDATE_CONFIG', `Updated config version: ${newConfigData.version || '2.0'}`, now);
      } catch (logErr) {}
    } catch (e) {
      console.error('Error saving to SQLite:', e);
    }
  }

  // 2. Luôn ghi thêm file backup JSON để an toàn tuyệt đối và dễ xem
  try {
    fs.writeFileSync(BACKUP_JSON_FILE, JSON.stringify(newConfigData, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing backup JSON:', e);
  }

  return { success: true, updatedAt: now };
}

// =============================================================================
// 2. MIME TYPES & STATIC FILE HANDLER
// =============================================================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.sqlite': 'application/x-sqlite3'
};

// =============================================================================
// 3. HTTP SERVER XỬ LÝ REST API VÀ GIAO DIỆN
// =============================================================================
const server = http.createServer((req, res) => {
  // CORS Headers cho mọi request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ---------------------------------------------------------------------------
  // API ENDPOINTS:
  // ---------------------------------------------------------------------------
  if (pathname === '/api/config' && req.method === 'GET') {
    const result = getConfigFromDb();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(JSON.stringify({
      success: true,
      data: result.data,
      updatedAt: result.updatedAt,
      engine: result.engine
    }));
    return;
  }

  if (pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Giới hạn payload 50MB (cho phép cả ảnh Base64 nén)
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const saveRes = saveConfigToDb(parsed);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        });
        res.end(JSON.stringify({
          success: true,
          message: '✦ Đã lưu cấu hình vào Cơ sở dữ liệu SQLite thành công! Mọi thiết bị truy cập sẽ thấy ngay lập tức. ✦',
          updatedAt: saveRes.updatedAt
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Dữ liệu JSON không hợp lệ: ' + e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/db-status' && req.method === 'GET') {
    let dbSize = 0;
    if (fs.existsSync(DB_FILE)) {
      dbSize = fs.statSync(DB_FILE).size;
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(JSON.stringify({
      success: true,
      dbEngine: dbEngine,
      dbFile: 'database.sqlite',
      dbSizeBytes: dbSize,
      dbSizeFormatted: `${(dbSize / 1024).toFixed(1)} KB`,
      status: 'online',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    if (fs.existsSync(DEFAULT_DATA_FILE)) {
      try {
        const def = JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf8'));
        saveConfigToDb(def);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Đã đặt lại dữ liệu gốc vào Database!' }));
        return;
      } catch (e) {}
    }
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Không thể reset' }));
    return;
  }

  // ---------------------------------------------------------------------------
  // SHARED PAGE API ENDPOINTS:
  // ---------------------------------------------------------------------------

  // Tạo trang chia sẻ riêng biệt (snapshot config hiện tại + label)
  if (pathname === '/api/share/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const label = parsed.label || 'Trang Chia Sẻ VIP';
        const configData = parsed.config || {};

        // Tạo ID ngắn gọn duy nhất (8 ký tự alphanumeric)
        const shareId = crypto.randomBytes(4).toString('hex');
        const now = new Date().toISOString();

        if (db) {
          const stmt = db.prepare(
            "INSERT INTO shared_pages (id, label, config_data, created_at, views) VALUES (?, ?, ?, ?, 0)"
          );
          stmt.run(shareId, label, JSON.stringify(configData), now);

          // Ghi audit log
          try {
            const logStmt = db.prepare(
              "INSERT INTO audit_logs (action, details, created_at) VALUES (?, ?, ?)"
            );
            logStmt.run('CREATE_SHARE', `Created shared page: ${label} (ID: ${shareId})`, now);
          } catch (logErr) {}
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          shareId: shareId,
          label: label,
          createdAt: now,
          message: `✦ Đã tạo trang chia sẻ riêng thành công! ID: ${shareId}`
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Dữ liệu không hợp lệ: ' + e.message }));
      }
    });
    return;
  }

  // Lấy danh sách tất cả trang chia sẻ đã tạo
  if (pathname === '/api/share/list' && req.method === 'GET') {
    let pages = [];
    if (db) {
      try {
        const stmt = db.prepare("SELECT id, label, created_at, views FROM shared_pages ORDER BY created_at DESC");
        pages = stmt.all();
      } catch (e) {
        console.error('Error listing shared pages:', e);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, pages: pages }));
    return;
  }

  // Lấy cấu hình trang chia sẻ theo ID + tăng lượt xem
  const shareMatch = pathname.match(/^\/api\/share\/([a-zA-Z0-9]{6,12})$/);
  if (shareMatch && req.method === 'GET') {
    const shareId = shareMatch[1];
    if (db) {
      try {
        const stmt = db.prepare("SELECT id, label, config_data, created_at, views FROM shared_pages WHERE id = ?");
        const row = stmt.get(shareId);
        if (row) {
          // Tăng lượt xem
          try {
            const updateStmt = db.prepare("UPDATE shared_pages SET views = views + 1 WHERE id = ?");
            updateStmt.run(shareId);
          } catch (ue) {}

          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          });
          res.end(JSON.stringify({
            success: true,
            shareId: row.id,
            label: row.label,
            config: JSON.parse(row.config_data),
            createdAt: row.created_at,
            views: (row.views || 0) + 1
          }));
          return;
        }
      } catch (e) {
        console.error('Error fetching shared page:', e);
      }
    }
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Không tìm thấy trang chia sẻ này!' }));
    return;
  }

  // Xóa trang chia sẻ
  const shareDeleteMatch = pathname.match(/^\/api\/share\/([a-zA-Z0-9]{6,12})$/);
  if (shareDeleteMatch && req.method === 'DELETE') {
    const shareId = shareDeleteMatch[1];
    if (db) {
      try {
        const stmt = db.prepare("DELETE FROM shared_pages WHERE id = ?");
        stmt.run(shareId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Đã xóa trang chia sẻ thành công!' }));
        return;
      } catch (e) {}
    }
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Không thể xóa' }));
    return;
  }

  // ---------------------------------------------------------------------------
  // STATIC FILES SERVING:
  // ---------------------------------------------------------------------------
  let reqPath = decodeURI(pathname);
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath === '/farewell') reqPath = '/farewell.html';

  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server & SQLite Database đang chạy tại: http://localhost:${PORT}`);
  console.log(`💽 Cơ sở dữ liệu: ${DB_FILE}`);
  console.log(`📦 Sao lưu dự phòng: ${BACKUP_JSON_FILE}`);
  console.log(`====================================================`);
});
