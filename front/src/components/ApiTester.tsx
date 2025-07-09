import React, { useState } from 'react';
import { movieApi, healthApi, systemApi, handleApiError } from '../api';

const ApiTester: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (name: string, testFunction: () => Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);
      
      console.log(`🧪 Testing ${name}...`);
      const result = await testFunction();
      console.log(`✅ ${name} Success:`, result);
      setResults({ name, result });
    } catch (err) {
      console.error(`❌ ${name} Error:`, err);
      setError(`${name}: ${handleApiError(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      description: 'Vérifier l\'état de l\'API',
      test: () => healthApi.check()
    },
    {
      name: 'Neo4j Test',
      description: 'Tester la connexion Neo4j',
      test: () => systemApi.testNeo4j()
    },
    {
      name: 'Get Movies',
      description: 'Récupérer la liste des films',
      test: () => movieApi.getAll(5, 0)
    },
    {
      name: 'Search Movies',
      description: 'Rechercher des films',
      test: () => movieApi.search('Matrix')
    },
    {
      name: 'Get Movie Details',
      description: 'Détails d\'un film spécifique',
      test: () => movieApi.getByTitle('The Matrix')
    },
    {
      name: 'Get Recommendations',
      description: 'Recommandations pour un film',
      test: () => movieApi.getRecommendations('The Matrix')
    }
  ];

  return (
    <div className="api-tester">
      <div className="api-tester-header">
        <h3>🧪 Testeur d'API</h3>
        <p>Testez les différents endpoints de l'API</p>
      </div>
      
      <div className="tests-grid">
        {tests.map((test, index) => (
          <div key={index} className="test-card">
            <h4>{test.name}</h4>
            <p>{test.description}</p>
            <button
              onClick={() => testEndpoint(test.name, test.test)}
              disabled={loading}
              className="test-button"
            >
              {loading ? 'Test en cours...' : 'Tester'}
            </button>
          </div>
        ))}
      </div>
      
      {loading && (
        <div className="test-loading">
          <div className="spinner">Test en cours...</div>
        </div>
      )}
      
      {error && (
        <div className="test-error">
          <h4>❌ Erreur</h4>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="test-results">
          <h4>✅ Résultats - {results.name}</h4>
          <pre className="results-json">
            {JSON.stringify(results.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTester;
