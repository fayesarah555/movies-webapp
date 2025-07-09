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
        <h2>🧪 Test de toutes les routes API</h2>
        <p>Teste toutes les routes disponibles dans l'API OpenAPI</p>
        
        <div className="test-actions">
          <button 
            onClick={testAllRoutes}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '🔄 Test en cours...' : '🚀 Tester toutes les routes'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-section">
            <h3>📊 Résultats des tests ({results.length} routes)</h3>
            
            <div className="results-summary">
              <div className="summary-item">
                <span className="summary-label">Succès:</span>
                <span className="summary-value success">
                  {results.filter(r => r.status === 'success').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Erreurs:</span>
                <span className="summary-value error">
                  {results.filter(r => r.status === 'error').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">En cours:</span>
                <span className="summary-value loading">
                  {results.filter(r => r.status === 'loading').length}
                </span>
              </div>
            </div>

            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Méthode</th>
                    <th>Endpoint</th>
                    <th>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td>
                        <span 
                          className="status-icon"
                          style={{ color: getStatusColor(result.status) }}
                        >
                          {getStatusIcon(result.status)}
                        </span>
                      </td>
                      <td>
                        <span className="method-badge">{result.method}</span>
                      </td>
                      <td>
                        <code>{result.endpoint}</code>
                      </td>
                      <td>
                        {result.status === 'success' && (
                          <details>
                            <summary>Données reçues</summary>
                            <pre>{JSON.stringify(result.data, null, 2)}</pre>
                          </details>
                        )}
                        {result.status === 'error' && (
                          <span className="error-text">{result.error}</span>
                        )}
                        {result.status === 'loading' && (
                          <span className="loading-text">Chargement...</span>
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
