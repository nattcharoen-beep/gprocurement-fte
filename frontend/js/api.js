const API_BASE = window.API_BASE 
  || localStorage.getItem('API_BASE')
  || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8787/api' 
      : 'https://gprocurement-fte.natt-charoen.workers.dev/api');

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/reset-password');
    const isLoginPage = window.location.pathname.includes('login') || window.location.pathname.includes('register');

    if (response.status === 401 && !isAuthRoute && !isLoginPage) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('active_session_id');
      window.location.href = 'login.html';
    }
    throw new Error(data?.error || `Error ${response.status}`);
  }

  return data;
}

const api = {
  login: (identifier, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, username: identifier, password })
  }),
  register: (name, email, password, username) => {
    const payload = typeof name === 'object' 
      ? name 
      : { name, email, password, username: username || (email ? email.split('@')[0] : '') };
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  resetPassword: (email, recovery_key, new_password) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, recovery_key, new_password })
  }),
  getMe: () => apiRequest('/auth/me'),
  updateSettings: (settings) => apiRequest('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),
  getAnnouncements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/announcements${query ? '?' + query : ''}`);
  },
  getAnnouncementDetail: (id) => apiRequest(`/announcements/${encodeURIComponent(id)}`),
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/announcements/stats${query ? '?' + query : ''}`);
  },
  getWinners: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/winners${query ? '?' + query : ''}`);
  },
  getWinnerStats: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/winners/stats${query ? '?' + query : ''}`);
  },
  toggleBookmark: (announcementId, note = '') => apiRequest(`/bookmarks/${encodeURIComponent(announcementId)}`, {
    method: 'POST',
    body: JSON.stringify({ note })
  }),
  removeBookmark: (announcementId) => apiRequest(`/bookmarks/${encodeURIComponent(announcementId)}`, {
    method: 'DELETE'
  }),
  getBookmarks: () => apiRequest('/bookmarks'),
  getAdminUsers: () => apiRequest('/admin/users'),
  approveUser: (id) => apiRequest(`/admin/users/${id}/approve`, { method: 'PUT' }),
  rejectUser: (id) => apiRequest(`/admin/users/${id}/reject`, { method: 'PUT' }),
  getAdminLogs: () => apiRequest('/admin/logs'),
  seedAdmin: () => apiRequest('/admin/seed', { method: 'POST' }),
  submitFeedback: (announcementId, projectId, isMatch, reason = null, note = null) => apiRequest('/feedback', {
    method: 'POST',
    body: JSON.stringify({ announcement_id: announcementId, project_id: projectId, is_match: isMatch, reason, note })
  }),
  getMyFeedback: () => apiRequest('/feedback/mine'),
  getFeedbackStats: () => apiRequest('/feedback/stats'),
  startSession: (page) => apiRequest('/auth/session-start', {
    method: 'POST',
    body: JSON.stringify({ page: page || window.location.pathname })
  }),
  sendHeartbeat: (sessionId, page) => apiRequest('/auth/heartbeat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, page: page || window.location.pathname })
  }),
  endSession: (sessionId) => {
    try {
      const url = `${API_BASE}/auth/session-end`;
      const body = JSON.stringify({ sessionId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
      }
    } catch (e) {
      // Ignore cleanup error
    }
  },
  getUserActivity: () => apiRequest('/admin/user-activity')
};
