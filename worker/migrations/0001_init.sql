-- ====================================================================
-- Cloudflare D1 Database Schema: Firetrade Engineering (FTE) GProcurement
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('viewer', 'admin')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    receive_email INTEGER DEFAULT 0,
    last_login_at DATETIME,
    total_usage_seconds INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Announcements Table (Thai e-GP Tenders)
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT NOT NULL,
    announce_type TEXT NOT NULL, -- P0, B0, 15, D0, W0
    announce_date DATETIME,
    doc_start_date TEXT,
    doc_end_date TEXT,
    bid_date TEXT,
    bid_time TEXT,
    doc_verified INTEGER DEFAULT 0,
    budget REAL,
    department TEXT,
    province TEXT,
    product_group TEXT, -- fire_alarm, fire_sprinkler_pump, fire_suppression_gas, fire_hydrant_equipment, safety_ppe_emergency
    url TEXT,
    -- Winner fields (W0)
    winner_name TEXT,
    winner_price REAL,
    winner_tax_id TEXT,
    discount_percent REAL,
    -- BOQ & Attachment Scanner fields
    boq_summary TEXT,
    boq_matches TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    announcement_id TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(announcement_id) REFERENCES announcements(id)
);

-- 4. User Feedback Table (ใช่งานตรงสาย / ไม่ใช่งาน)
CREATE TABLE IF NOT EXISTS project_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    announcement_id TEXT NOT NULL,
    project_id TEXT,
    is_match INTEGER NOT NULL, -- 1 = ใช่งาน, 0 = ไม่ใช่งาน
    reason TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

-- 5. User Activity Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    current_page TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 6. Fetch Logs Table
CREATE TABLE IF NOT EXISTS fetch_logs (
    id TEXT PRIMARY KEY,
    run_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    items_fetched INTEGER DEFAULT 0,
    errors TEXT
);

-- Indexes for Ultra-Fast Edge Querying
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(announce_type);
CREATE INDEX IF NOT EXISTS idx_announcements_group ON announcements(product_group);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(announce_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_budget ON announcements(budget DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_province ON announcements(province);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_feedback_match ON project_feedback(is_match);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON user_sessions(last_active_at DESC);
