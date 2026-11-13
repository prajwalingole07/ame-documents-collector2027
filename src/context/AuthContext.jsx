import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentSession } from '../firebase/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getCurrentSession();
    setUser(session);
    setLoading(false);
  }, []);

  const login = (session) => {
    setUser(session);
    localStorage.setItem('ame_session', JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ame_session');
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
