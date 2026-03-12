import { useState, useEffect, createContext, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('offboardiq_token');
    const savedUser = localStorage.getItem('offboardiq_user');
    if (token && savedUser) {
      api.setToken(token);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    api.setToken(data.accessToken);
    localStorage.setItem('offboardiq_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const data = await api.post('/auth/register', formData);
    api.setToken(data.accessToken);
    localStorage.setItem('offboardiq_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    api.clearToken();
    localStorage.removeItem('offboardiq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
