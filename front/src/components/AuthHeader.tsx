import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthHeader: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      const userData = JSON.parse(user);
      setUsername(userData.username);
      setUserRole(userData.role);
    }
  }, []);

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
    setShowLogin(false);
    
    // Récupérer les informations utilisateur depuis le localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUsername(userData.username);
      setUserRole(userData.role);
    }
  };

  const handleRegister = (_newUsername: string) => {
    setShowRegister(false);
    setShowLogin(true); // Rediriger vers la connexion après inscription
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setUserRole('user');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑 Admin';
      case 'user':
        return '👤 Utilisateur';
      default:
        return '👤 Utilisateur';
    }
  };

  return (
    <div className="auth-header">
      {isAuthenticated ? (
        <div className="user-info">
          <span className="username">
            {getRoleDisplay(userRole)} {username}
          </span>
          <button onClick={handleLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      ) : (
        <div className="auth-buttons">
          <button onClick={() => setShowLogin(true)} className="login-button">
            Se connecter
          </button>
          <button onClick={() => setShowRegister(true)} className="register-button">
            S'inscrire
          </button>
        </div>
      )}

      {showLogin && (
        <LoginForm
          onSuccess={handleLogin}
          onCancel={() => setShowLogin(false)}
        />
      )}

      {showRegister && (
        <RegisterForm
          onSuccess={handleRegister}
          onCancel={() => setShowRegister(false)}
        />
      )}
    </div>
  );
};

export default AuthHeader;
