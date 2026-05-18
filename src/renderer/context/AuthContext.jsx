import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, validateLogin, logout as localLogout } from '../data/userStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 直接从 localStorage 同步读取，零延迟
  const [user, setUser] = useState(() => getCurrentUser());

  const login = (username, password) => {
    const result = validateLogin(username, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    localLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
