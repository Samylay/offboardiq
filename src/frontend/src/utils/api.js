const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('offboardiq_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('offboardiq_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('offboardiq_token');
  }

  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body }); }
  patch(path, body) { return this.request(path, { method: 'PATCH', body }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
export default api;
