import React, { useState } from 'react';
import { api, handleApiError } from '../api';

const Neo4jTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testNeo4j = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.get('/neo4j/test');
      setResult(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo4j-test">
      <div className="panel">
        <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>Test Neo4j</h2>
        <p style={{ color: '#222', marginBottom: 24 }}>Test de la connexion à la base Neo4j</p>
        
        <div className="test-actions">
          <button 
            onClick={testNeo4j}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '🔄 Test en cours...' : '🚀 Tester Neo4j'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ Erreur : {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>✅ Résultat du test</h3>
            <div className="result-content">
              <pre style={{ color: '#222', background: '#f5f5f5', borderRadius: 6, padding: 12, fontSize: 15 }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Neo4jTest;
