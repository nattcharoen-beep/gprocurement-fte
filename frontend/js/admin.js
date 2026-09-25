// admin.js
let activityAutoRefreshTimer = null;
let currentAdminUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Role check: verify current user is admin
  try {
    const meRes = await api.getMe();
    currentAdminUser = meRes?.data || meRes;
    if (!currentAdminUser || currentAdminUser.role !== 'admin') {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin ผู้ดูแลระบบ)');
      window.location.href = 'dashboard.html';
      return;
    }
  } catch (err) {
    console.warn('Admin check error:', err);
  }

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      
      tab.classList.add('active');
      const tabId = `tab-${tab.dataset.tab}`;
      const targetEl = document.getElementById(tabId);
      if (targetEl) targetEl.classList.remove('hidden');
      
      // Stop timer if leaving activity tab
      if (activityAutoRefreshTimer) {
        clearInterval(activityAutoRefreshTimer);
        activityAutoRefreshTimer = null;
      }

      if (tab.dataset.tab === 'users') loadUsers();
      if (tab.dataset.tab === 'activity') {
        loadUserActivity();
        // Auto refresh every 30s while viewing activity tab
        activityAutoRefreshTimer = setInterval(() => {
          if (!document.hidden) loadUserActivity(true);
        }, 30000);
      }
      if (tab.dataset.tab === 'logs') loadLogs();
    });
  });

  const btnFetch = document.getElementById('btn-fetch');
  if (btnFetch) {
    btnFetch.addEventListener('click', async () => {
      btnFetch.disabled = true;
      const origText = btnFetch.innerHTML;
      btnFetch.innerHTML = '⏳ กำลังโหลดข้อมูล...';
      try {
        await loadLogs();
      } finally {
        btnFetch.disabled = false;
        btnFetch.innerHTML = origText;
      }
    });
  }

  const btnRefreshActivity = document.getElementById('btn-refresh-activity');
  if (btnRefreshActivity) {
    btnRefreshActivity.addEventListener('click', () => loadUserActivity());
  }

  // Load initial tab (support URL query param ?tab=activity)
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab');
  const targetTabBtn = targetTab ? document.querySelector(`.tab[data-tab="${targetTab}"]`) : null;
  if (targetTabBtn) {
    targetTabBtn.click();
  } else {
    loadUsers();
  }
});

async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">กำลังโหลดรายชื่อผู้ใช้...</td></tr>';

  try {
    const res = await api.getAdminUsers();
    const users = res.data || [];
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">ยังไม่มีผู้ใช้งานในระบบ</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      let statusBadge = '';
      if (u.status === 'pending') statusBadge = '<span class="badge type-b0" style="font-weight: 700;">⏳ รออนุมัติ</span>';
      else if (u.status === 'approved') statusBadge = '<span class="badge type-p0">✅ อนุมัติแล้ว</span>';
      else if (u.status === 'rejected') statusBadge = '<span class="badge type-d0">❌ ปฏิเสธ</span>';

      const displayName = (u.name || u.username || u.email || 'ผู้ใช้').replace(/'/g, "\\'");
      let actions = '';
      if (u.status === 'pending') {
        actions = `
          <button onclick="approveUser('${u.id}', '${displayName}')" class="btn btn-success" style="padding: 5px 12px; font-size: 0.82rem; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">✅ อนุมัติ</button>
          <button onclick="rejectUser('${u.id}', '${displayName}')" class="btn btn-danger" style="padding: 5px 12px; font-size: 0.82rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-left: 4px;">❌ ปฏิเสธ</button>
        `;
      } else if (u.status === 'rejected') {
        actions = `
          <button onclick="approveUser('${u.id}', '${displayName}')" class="btn" style="padding: 4px 10px; font-size: 0.8rem; background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; border-radius: 4px; cursor: pointer; font-weight: 600;">เปลี่ยนเป็นอนุมัติ</button>
        `;
      } else if (u.status === 'approved') {
        const isSelf = currentAdminUser && (currentAdminUser.id === u.id || currentAdminUser.email === u.email);
        if (isSelf || u.role === 'admin') {
          actions = `<span style="color: #64748b; font-size: 0.82rem;">(ผู้ดูแลระบบ)</span>`;
        } else {
          actions = `
            <button onclick="rejectUser('${u.id}', '${displayName}')" class="btn" style="padding: 4px 10px; font-size: 0.8rem; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; border-radius: 4px; cursor: pointer;">ระงับสิทธิ์</button>
          `;
        }
      }

      const isPending = u.status === 'pending';
      const rowStyle = isPending ? 'background-color: #fffbeb; font-weight: 500;' : '';

      return `
        <tr style="${rowStyle}">
          <td>
            <div style="font-weight: 700; color: #0f172a;">${u.username || '-'}</div>
            ${u.name ? `<div style="font-size: 0.82rem; color: #64748b;">${u.name}</div>` : ''}
            ${isPending ? `<span style="display: inline-block; font-size: 0.72rem; color: #b45309; background: #fef3c7; padding: 1px 6px; border-radius: 4px; margin-top: 2px;">เพิ่งสมัครใหม่</span>` : ''}
          </td>
          <td>${u.email}</td>
          <td>${statusBadge}</td>
          <td>${u.role === 'admin' ? '<span style="font-weight: 700; color: #0284c7;">Admin</span>' : 'User'}</td>
          <td>${actions}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="error-msg text-center">Error: ${err.message}</td></tr>`;
  }
}

window.approveUser = async function(id, name) {
  const targetLabel = name ? `คุณ "${name}"` : 'ผู้ใช้นี้';
  if (confirm(`ยืนยันการอนุมัติ ${targetLabel} ให้เข้าใช้งานระบบ?`)) {
    try {
      await api.approveUser(id);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};

window.rejectUser = async function(id, name) {
  const targetLabel = name ? `คุณ "${name}"` : 'ผู้ใช้นี้';
  if (confirm(`ยืนยันการปฏิเสธ / ระงับสิทธิ์ ${targetLabel}?`)) {
    try {
      await api.rejectUser(id);
      loadUsers();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  }
};

async function loadLogs() {
  const tbody = document.querySelector('#logs-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" class="text-center">กำลังโหลด...</td></tr>';

  try {
    const res = await api.getAdminLogs();
    const logs = res.data || [];
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">ยังไม่มีประวัติการรัน Scraper</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let statusBadge = l.status === 'success' 
        ? '<span class="badge type-p0">สำเร็จ</span>' 
        : '<span class="badge type-d0">มีข้อผิดพลาด</span>';

      return `
        <tr>
          <td>${formatDate(l.run_date)} ${new Date(l.run_date).toLocaleTimeString('th-TH')}</td>
          <td>${statusBadge}</td>
          <td>${l.items_fetched || 0}</td>
          <td>${l.errors || '-'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="error-msg text-center">Error: ${err.message}</td></tr>`;
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 วิ';
  const s = Math.floor(seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} ชม.`);
  if (minutes > 0) parts.push(`${minutes} นาที`);
  if (secs > 0 && hours === 0) parts.push(`${secs} วิ`);
  return parts.length > 0 ? parts.join(' ') : '0 วิ';
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return 'เมื่อสักครู่';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
  return `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
}

async function loadUserActivity(isAutoRefresh = false) {
  const usersTbody = document.querySelector('#activity-users-table tbody');
  const sessionsTbody = document.querySelector('#activity-sessions-table tbody');
  
  if (!isAutoRefresh) {
    if (usersTbody) usersTbody.innerHTML = '<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูลการใช้งาน...</td></tr>';
    if (sessionsTbody) sessionsTbody.innerHTML = '<tr><td colspan="7" class="text-center">กำลังโหลดประวัติเซสชัน...</td></tr>';
  }

  try {
    const res = await api.getUserActivity();
    const data = res?.data || {};
    const stats = data.stats || {};
    const users = data.users || [];
    const sessions = data.sessions || [];

    // 1. Update Metrics Cards
    const elOnline = document.getElementById('stat-online-users');
    const elTotalUsers = document.getElementById('stat-total-users');
    const elTotalDuration = document.getElementById('stat-total-duration');
    const elTotalSessions = document.getElementById('stat-total-sessions');

    if (elOnline) elOnline.textContent = `${stats.online_users || 0} คน`;
    if (elTotalUsers) elTotalUsers.textContent = `${stats.total_active_users || 0} คน`;
    if (elTotalDuration) elTotalDuration.textContent = formatDuration(stats.total_duration_seconds);
    if (elTotalSessions) elTotalSessions.textContent = `${stats.total_sessions || 0} ครั้ง`;

    // 2. Render User Aggregates
    if (usersTbody) {
      if (users.length === 0) {
        usersTbody.innerHTML = '<tr><td colspan="7" class="text-center">ยังไม่มีข้อมูลการเข้าใช้งาน</td></tr>';
      } else {
        usersTbody.innerHTML = users.map(u => {
          const isOnline = u.is_online === 1;
          const statusBadge = isOnline 
            ? '<span class="online-badge online">กำลังออนไลน์</span>' 
            : '<span class="online-badge offline">ออฟไลน์</span>';

          const pageDisplay = u.last_page 
            ? `<span style="font-family: monospace; font-size: 0.8rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0284c7;">${u.last_page}</span>` 
            : '-';

          return `
            <tr style="${isOnline ? 'background: #f0fdf4;' : ''}">
              <td>
                <div style="font-weight: 700; color: #0f172a;">${u.username || '-'}</div>
                ${u.name ? `<div style="font-size: 0.8rem; color: #64748b;">${u.name}</div>` : ''}
              </td>
              <td>${u.email}</td>
              <td>${statusBadge}</td>
              <td>
                <div style="font-weight: 500;">${formatRelativeTime(u.last_active_at)}</div>
                ${u.last_active_at ? `<small style="color: #94a3b8; font-size: 0.75rem;">${new Date(u.last_active_at.endsWith('Z') ? u.last_active_at : u.last_active_at + 'Z').toLocaleTimeString('th-TH')}</small>` : ''}
              </td>
              <td>${pageDisplay}</td>
              <td>
                <span style="font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 3px 8px; border-radius: 6px; font-size: 0.88rem; display: inline-block;">
                  ⏱️ ${formatDuration(u.total_duration_seconds)}
                </span>
              </td>
              <td style="font-weight: 600; text-align: center;">${u.session_count || 0}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // 3. Render Detailed Recent Sessions
    if (sessionsTbody) {
      if (sessions.length === 0) {
        sessionsTbody.innerHTML = '<tr><td colspan="7" class="text-center">ยังไม่มีประวัติการเข้าใช้งานล่าสุด</td></tr>';
      } else {
        sessionsTbody.innerHTML = sessions.map(s => {
          const isOnline = s.is_online === 1;
          const statusBadge = isOnline 
            ? '<span class="online-badge online">กำลังใช้งาน</span>' 
            : '<span class="online-badge offline">เสร็จสิ้น</span>';

          const deviceIcon = s.device_type === 'mobile' ? '📱 มือถือ' : '💻 คอมพิวเตอร์';
          const startDate = s.started_at ? new Date(s.started_at.endsWith('Z') ? s.started_at : s.started_at + 'Z') : null;
          const startTimeStr = startDate ? `${startDate.toLocaleDateString('th-TH')} ${startDate.toLocaleTimeString('th-TH')}` : '-';

          return `
            <tr style="${isOnline ? 'background: #f0fdf4;' : ''}">
              <td>
                <div style="font-weight: 700; color: #0f172a;">${s.username || '-'}</div>
                ${s.name ? `<div style="font-size: 0.78rem; color: #64748b;">${s.name}</div>` : ''}
              </td>
              <td style="font-size: 0.85rem;">${startTimeStr}</td>
              <td style="font-size: 0.85rem;">
                <div>${formatRelativeTime(s.last_active_at)}</div>
              </td>
              <td>
                <span style="background: #f1f5f9; color: #0f172a; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; border: 1px solid #cbd5e1;">
                  ⏱️ ${formatDuration(s.duration_seconds)}
                </span>
              </td>
              <td style="font-size: 0.85rem;">
                <div>${deviceIcon}</div>
                ${s.current_page ? `<small style="color: #64748b; font-family: monospace;">${s.current_page}</small>` : ''}
              </td>
              <td style="font-size: 0.8rem; font-family: monospace; color: #64748b;">${s.ip_address || '-'}</td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('loadUserActivity error:', err);
    if (!isAutoRefresh) {
      if (usersTbody) usersTbody.innerHTML = `<tr><td colspan="7" class="error-msg text-center">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
      if (sessionsTbody) sessionsTbody.innerHTML = `<tr><td colspan="7" class="error-msg text-center">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
    }
  }
}
