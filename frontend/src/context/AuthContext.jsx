import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const normalize = (u) => u ? { ...u, _id: u._id || u.id, id: u.id || u._id } : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.getMe();
      const u = res?.data ?? res;
      if (u?.email) setUser(normalize(u));
      else { localStorage.removeItem('token'); localStorage.removeItem('fs_mock_user'); }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('fs_mock_user');
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { user: u, token } = res.data;
    localStorage.setItem('token', token);
    const norm = normalize(u);
    setUser(norm);
    return norm;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: u, token } = res.data;
    localStorage.setItem('token', token);
    const norm = normalize(u);
    setUser(norm);
    return norm;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fs_mock_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
