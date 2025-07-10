import React, { useState } from 'react';
import { authApi, handleApiError } from '../api';

interface LoginFormProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Veuillez saisir un nom d\'utilisateur et un mot de passe');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login({ username, password });
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        
        // Utiliser les informations de rôle retournées par l'API
        const user = { 
          username: response.username,
          role: response.role
        };
        localStorage.setItem('user', JSON.stringify(user));
        
        onSuccess(response.access_token);
      } else {
        setError('Erreur lors de la connexion');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-overlay">
      <div className="login-form-modal">
        <div className="login-form-header">
          <h2>🔐 Connexion</h2>
          <button onClick={onCancel} className="close-button">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
