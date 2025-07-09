import React, { useState } from 'react';
import { 
  movieApi, 
  personApi, 
  collaborationApi, 
  reviewApi, 
  statsApi, 
  systemApi,
  handleApiError 
} from '../api';

interface AllRoutesTestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
}

const AllRoutesTester: React.FC = () => {
  const [results, setResults] = useState<AllRoutesTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const updateResult = (endpoint: string, method: string, status: 'success' | 'error' | 'loading', data?: any, error?: string) => {
    setResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint && r.method === method);
      if (existing) {
        return prev.map(r => 
          r.endpoint === endpoint && r.method === method 
            ? { ...r, status, data, error }
            : r
        );
      } else {
        return [...prev, { endpoint, method, status, data, error }];
      }
    });
  };

  const testAllRoutes = async () => {
    setLoading(true);
    setResults([]);

    const tests = [
      // System routes
      { fn: () => systemApi.getRoot(), endpoint: '/', method: 'GET' },
      { fn: () => systemApi.healthCheck(), endpoint: '/health', method: 'GET' },
      { fn: () => systemApi.testNeo4j(), endpoint: '/neo4j/test', method: 'GET' },
      
      // Movie routes
      { fn: () => movieApi.getAll(5), endpoint: '/movies', method: 'GET' },
      { fn: () => movieApi.search('matrix'), endpoint: '/search/movies', method: 'GET' },
      { fn: () => movieApi.getByTitle('The Matrix'), endpoint: '/movies/{title}', method: 'GET' },
      { fn: () => movieApi.getActors('The Matrix'), endpoint: '/movies/{title}/actors', method: 'GET' },
      { fn: () => movieApi.getRecommendations('The Matrix'), endpoint: '/recommend/movies/similar/{title}', method: 'GET' },
      
      // Person routes
      { fn: () => personApi.getAll(5), endpoint: '/persons', method: 'GET' },
      { fn: () => personApi.getByName('Keanu Reeves'), endpoint: '/persons/{name}', method: 'GET' },
      { fn: () => personApi.getMoviesByActor('Keanu Reeves'), endpoint: '/actors/{name}/movies', method: 'GET' },
      
      // Other routes
      { fn: () => collaborationApi.getCollaborations('Keanu Reeves', 'Laurence Fishburne'), endpoint: '/collaborations', method: 'GET' },
      { fn: () => reviewApi.getByMovie('The Matrix'), endpoint: '/reviews/{movie_title}', method: 'GET' },
      { fn: () => statsApi.getStats(), endpoint: '/stats', method: 'GET' },
    ];

    for (const test of tests) {
      updateResult(test.endpoint, test.method, 'loading');
      try {
        const data = await test.fn();
        updateResult(test.endpoint, test.method, 'success', data);
      } catch (error) {
        updateResult(test.endpoint, test.method, 'error', null, handleApiError(error));
      }
    }

    setLoading(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '🔄';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'loading') => {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'loading': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="all-routes-tester">
      <div className="panel">
        <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>🧪 Test de toutes les routes API</h2>
        <p style={{ color: '#222', marginBottom: 24 }}>Teste toutes les routes disponibles dans l'API OpenAPI</p>
        <div className="test-actions" style={{ marginBottom: 24 }}>
          <button 
            onClick={testAllRoutes}
            disabled={loading}
            style={{ color: loading ? '#fff' : '#1976d2', background: loading ? '#1976d2' : '#e3f2fd', fontWeight: 600, borderRadius: 6, padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 16 }}
          >
            {loading ? '🔄 Test en cours...' : '🚀 Tester toutes les routes'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="results-section">
            <h3 style={{ color: '#1976d2', fontWeight: 600, marginBottom: 12 }}>📊 Résultats des tests ({results.length} routes)</h3>
            <div className="results-summary" style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div className="summary-item"><span className="summary-label" style={{ color: '#222' }}>Succès:</span> <span className="summary-value success" style={{ color: '#28a745', fontWeight: 700 }}>{results.filter(r => r.status === 'success').length}</span></div>
              <div className="summary-item"><span className="summary-label" style={{ color: '#222' }}>Erreurs:</span> <span className="summary-value error" style={{ color: '#dc3545', fontWeight: 700 }}>{results.filter(r => r.status === 'error').length}</span></div>
              <div className="summary-item"><span className="summary-label" style={{ color: '#222' }}>En cours:</span> <span className="summary-value loading" style={{ color: '#ffc107', fontWeight: 700 }}>{results.filter(r => r.status === 'loading').length}</span></div>
            </div>
            <div className="results-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#1976d2', fontWeight: 700, padding: 8 }}>Status</th>
                    <th style={{ color: '#1976d2', fontWeight: 700, padding: 8 }}>Méthode</th>
                    <th style={{ color: '#1976d2', fontWeight: 700, padding: 8 }}>Endpoint</th>
                    <th style={{ color: '#1976d2', fontWeight: 700, padding: 8 }}>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ textAlign: 'center', fontSize: 20, padding: 8 }}>
                        <span className="status-icon" style={{ color: getStatusColor(result.status) }}>{getStatusIcon(result.status)}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: 8 }}>
                        <span className="method-badge" style={{ color: '#fff', background: '#1976d2', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{result.method}</span>
                      </td>
                      <td style={{ color: '#222', fontFamily: 'monospace', fontSize: 15, padding: 8 }}>
                        <code>{result.endpoint}</code>
                      </td>
                      <td style={{ padding: 8 }}>
                        {result.status === 'success' && (
                          <details>
                            <summary style={{ color: '#1976d2', cursor: 'pointer' }}>Données reçues</summary>
                            <pre style={{ color: '#222', background: '#f5f5f5', borderRadius: 6, padding: 12, fontSize: 13 }}>{JSON.stringify(result.data, null, 2)}</pre>
                          </details>
                        )}
                        {result.status === 'error' && (
                          <span className="error-text" style={{ color: '#dc3545', fontWeight: 600 }}>{result.error}</span>
                        )}
                        {result.status === 'loading' && (
                          <span className="loading-text" style={{ color: '#ffc107', fontWeight: 600 }}>Chargement...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllRoutesTester;
