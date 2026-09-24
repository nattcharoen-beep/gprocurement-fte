import { Hono } from 'hono';
import { requireAuth, requireAdmin, hashPassword } from '../middleware/auth.js';

const router = new Hono();

router.post('/seed', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const adminEmail = c.env.ADMIN_EMAIL;
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return c.json({ error: 'Admin credentials not configured in env' }, 500);
  }

  const existing = await db.prepare('SELECT id FROM users WHERE role = ?').bind('admin').first();
  if (existing) {
    return c.json({ error: 'Admin already exists' }, 400);
  }

  const { hash, salt } = await hashPassword(adminPassword);
  const fullHash = `${salt}:${hash}`;
  const id = crypto.randomUUID();

  await db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, status, receive_email)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, adminEmail, fullHash, 'Admin', 'admin', 'approved', 1).run();

  return c.json({ data: { message: 'Initial admin created' } });
});

router.use('*', requireAuth, requireAdmin);

router.get('/users', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT id, username, email, name, role, status, receive_email, created_at FROM users ORDER BY created_at DESC').all();
  return c.json({ data: results });
});

router.put('/users/:id/approve', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  await db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").bind(id).run();
  return c.json({ data: { message: 'User approved' } });
});

router.put('/users/:id/reject', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  await db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").bind(id).run();
  return c.json({ data: { message: 'User rejected' } });
});

router.get('/logs', async (c) => {
  const db = c.env.DB;
  const { results } = await db.prepare('SELECT * FROM fetch_logs ORDER BY run_date DESC LIMIT 50').all();
  return c.json({ data: results });
});

router.get('/user-activity', async (c) => {
  try {
    const db = c.env.DB;

    // 1. Overall stats
    const statsRes = await db.prepare(`
      SELECT 
        COUNT(DISTINCT CASE WHEN strftime('%s', 'now') - strftime('%s', last_active_at) <= 180 THEN user_id END) as online_users,
        COUNT(DISTINCT user_id) as total_active_users,
        COUNT(id) as total_sessions,
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds
      FROM user_sessions
    `).first();

    // 2. Aggregate stats by user
    const userStats = await db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.role,
        u.status,
        u.last_login_at,
        COUNT(s.id) as session_count,
        COALESCE(SUM(s.duration_seconds), 0) as total_duration_seconds,
        MAX(s.last_active_at) as last_active_at,
        MAX(CASE WHEN strftime('%s', 'now') - strftime('%s', s.last_active_at) <= 180 THEN 1 ELSE 0 END) as is_online,
        (SELECT current_page FROM user_sessions WHERE user_id = u.id ORDER BY last_active_at DESC LIMIT 1) as last_page
      FROM users u
      LEFT JOIN user_sessions s ON u.id = s.user_id
      GROUP BY u.id
      ORDER BY is_online DESC, last_active_at DESC, total_duration_seconds DESC
    `).all();

    // 3. Recent 50 sessions
    const recentSessions = await db.prepare(`
      SELECT 
        s.id,
        s.user_id,
        COALESCE(s.username, u.username, u.email) as username,
        u.name,
        u.email,
        s.ip_address,
        s.device_type,
        s.user_agent,
        s.current_page,
        s.started_at,
        s.last_active_at,
        s.ended_at,
        s.duration_seconds,
        CASE WHEN strftime('%s', 'now') - strftime('%s', s.last_active_at) <= 180 THEN 1 ELSE 0 END as is_online
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.started_at DESC
      LIMIT 50
    `).all();

    return c.json({
      data: {
        stats: {
          online_users: statsRes?.online_users || 0,
          total_active_users: statsRes?.total_active_users || 0,
          total_sessions: statsRes?.total_sessions || 0,
          total_duration_seconds: statsRes?.total_duration_seconds || 0
        },
        users: userStats.results || [],
        sessions: recentSessions.results || []
      }
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default router;
