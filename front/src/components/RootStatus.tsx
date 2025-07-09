import React, { useState, useEffect } from 'react';
import { api, handleApiError } from '../api';

const RootStatus: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRootStatus = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.get('/');
      setResult(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRootStatus();
  }, []);

  return (
    <div className="root-status">
      <div className="panel">
        <h2>🏠 Status de l'API</h2>
        <p>Informations sur l'API et sa disponibilité</p>
        
        <div className="status-actions">
          <button 
            onClick={fetchRootStatus}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '🔄 Actualisation...' : '🔄 Actualiser'}
          </button>
        </div>

        {loading && (
          <div className="loading-message">
            ⏳ Chargement du statut...
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ Erreur : {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3>✅ Statut de l'API</h3>
            <div className="status-info">
              {typeof result === 'string' ? (
                <div className="status-message">{result}</div>
              ) : (
                <pre>{JSON.stringify(result, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RootStatus;
