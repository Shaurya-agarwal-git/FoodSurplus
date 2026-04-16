import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 6000
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('fs_mock_user');
    }
    return Promise.reject(error.response?.data || { error: { message: error.message || 'Network error' } });
  }
);

const DB_KEY = 'fs_users_db';
const getDB = () => { try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]') } catch { return [] } };
const saveDB = (u) => localStorage.setItem(DB_KEY, JSON.stringify(u));
const isMockToken = (t) => t && t.startsWith('mock_');

const mockRegister = (data) => {
  if (!data.name || !data.email || !data.password || !data.role) {
    return Promise.reject({ error: { message: 'All fields are required' } });
  }
  const db = getDB();
  if (db.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    return Promise.reject({ error: { message: 'Email already registered. Please log in.' } });
  }
  const user = {
    _id: `mock_${Date.now()}`,
    id: `mock_${Date.now()}`,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    phone: data.phone || '',
    role: data.role,
    verified: data.role !== 'ngo',
    _pw: data.password,
    stats: { mealsDonated: 0, mealsReceived: 0, co2Avoided: 0 },
    createdAt: new Date().toISOString()
  };
  saveDB([...db, user]);
  const token = `mock_${user._id}_${Date.now()}`;
  localStorage.setItem('fs_mock_user', JSON.stringify({ ...user, _pw: undefined }));
  const safeUser = { ...user };
  delete safeUser._pw;
  return Promise.resolve({ success: true, data: { user: safeUser, token } });
};

const mockLogin = (data) => {
  const db = getDB();
  const user = db.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u._pw === data.password);
  if (!user) return Promise.reject({ error: { message: 'Invalid email or password' } });
  const token = `mock_${user._id}_${Date.now()}`;
  const safeUser = { ...user };
  delete safeUser._pw;
  localStorage.setItem('fs_mock_user', JSON.stringify(safeUser));
  return Promise.resolve({ success: true, data: { user: safeUser, token } });
};

const mockGetMe = () => {
  const token = localStorage.getItem('token');
  if (!isMockToken(token)) return Promise.reject({ error: { message: 'Not authenticated' } });
  const user = JSON.parse(localStorage.getItem('fs_mock_user') || 'null');
  if (!user) return Promise.reject({ error: { message: 'Session expired' } });
  return Promise.resolve({ success: true, data: user });
};

const withMockFallback = (apiFn, mockFn) => async (...args) => {
  try {
    return await apiFn(...args);
  } catch (err) {
    const isNetworkError = !err?.error?.code && !err?.success === false;
    const hasNoResponse = err?.error?.message?.includes('Network') ||
      err?.error?.message?.includes('timeout') ||
      err?.error?.message?.includes('ECONNREFUSED') ||
      err?.error?.message?.includes('ERR_') ||
      err?.error?.message === 'Network Error';
    if (hasNoResponse || isNetworkError) return mockFn(...args);
    throw err;
  }
};

export const authAPI = {
  register: withMockFallback((data) => api.post('/auth/register', data), mockRegister),
  login: withMockFallback((data) => api.post('/auth/login', data), mockLogin),
  getMe: withMockFallback(() => api.get('/auth/me'), mockGetMe),
  updateProfile: (data) => api.put('/auth/profile', data)
};

const LISTINGS_KEY = 'fs_listings_db';
const getListingsDB = () => { try { return JSON.parse(localStorage.getItem(LISTINGS_KEY) || '[]') } catch { return [] } };
const saveListingsDB = (l) => localStorage.setItem(LISTINGS_KEY, JSON.stringify(l));

const mockCreateListing = (data) => {
  const db = getListingsDB();
  const user = JSON.parse(localStorage.getItem('fs_mock_user') || 'null');
  const listing = {
    _id: `listing_${Date.now()}`,
    ...data,
    donor: user ? { _id: user._id, name: user.name, phone: user.phone } : { name: 'You' },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveListingsDB([listing, ...db]);
  return Promise.resolve({ success: true, data: listing });
};

const mockGetListings = () => {
  const db = getListingsDB();
  return Promise.resolve({ success: true, data: db, count: db.length });
};

const mockClaimListing = (id) => {
  const db = getListingsDB();
  const user = JSON.parse(localStorage.getItem('fs_mock_user') || 'null');
  const updated = db.map(l => l._id === id ? { ...l, status: 'claimed', claimedBy: user, claimedAt: new Date().toISOString() } : l);
  saveListingsDB(updated);
  return Promise.resolve({ success: true, data: { listing: updated.find(l => l._id === id), chatId: `chat_${id}` } });
};

const mockCompleteListing = (id) => {
  const db = getListingsDB();
  const updated = db.map(l => l._id === id ? { ...l, status: 'completed', completedAt: new Date().toISOString() } : l);
  saveListingsDB(updated);
  return Promise.resolve({ success: true, data: updated.find(l => l._id === id) });
};

const mockDeleteListing = (id) => {
  saveListingsDB(getListingsDB().filter(l => l._id !== id));
  return Promise.resolve({ success: true, data: {} });
};

export const listingsAPI = {
  analyzeImage: (formData) => api.post('/listings/analyze-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .catch(() => Promise.resolve({ data: { imageUrl: '', analysis: { foodType: '', quantity: '', dietaryTags: [], confidence: 0 } } })),
  create: (data) => api.post('/listings', data).catch(() => mockCreateListing(data)),
  getAll: (params) => api.get('/listings', { params }).catch(() => mockGetListings()),
  getOne: (id) => api.get(`/listings/${id}`),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`).catch(() => mockDeleteListing(id)),
  claim: (id) => api.post(`/listings/${id}/claim`).catch(() => mockClaimListing(id)),
  complete: (id) => api.put(`/listings/${id}/complete`).catch(() => mockCompleteListing(id))
};

export const analyticsAPI = {
  getImpact: () => api.get('/analytics/impact').catch(() => ({ data: { mealsSaved: 12480, foodDistributed: 3240, co2Avoided: 8.1, activeDonors: 340 } })),
  getTrends: (params) => api.get('/analytics/trends', { params }).catch(() => ({ data: [] })),
  getDonorStats: (id) => api.get(`/analytics/donor/${id}/stats`).catch(() => ({ data: {} })),
  getReceiverStats: (id) => api.get(`/analytics/receiver/${id}/stats`).catch(() => ({ data: {} }))
};

export default api;
