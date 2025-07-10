import React, { createContext, useContext, useState, useEffect } from 'react';

// Type utilisateur minimal
export type AuthUser = {
  username: string;
  role: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  const login = (user: AuthUser) => {
    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(user));
  };
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
