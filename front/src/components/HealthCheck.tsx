import React, { useState, useEffect } from 'react';
import { healthApi, systemApi, handleApiError } from '../api';

const HealthCheck: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [neo4jStatus, setNeo4jStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [neo4jDetails, setNeo4jDetails] = useState<{message?: string; time?: string; uri?: string}>({});
  const [error, setError] = useState<string | null>(null);

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking');
      const response = await healthApi.check();
      
      if (response.status === 'OK') {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
      setError(handleApiError(err));
    }
  };

  const checkNeo4jHealth = async () => {
    try {
      setNeo4jStatus('checking');
      const response = await systemApi.testNeo4j();
      
      if (response.status === 'success') {
        setNeo4jStatus('online');
        setNeo4jDetails({
          message: response.message,
          time: response.time,
          uri: response.uri
        });
      } else {
        setNeo4jStatus('offline');
        setError(response.message || 'Erreur de connexion Neo4j');
      }
    } catch (err) {
      setNeo4jStatus('offline');
      setError(handleApiError(err));
    }
  };

  const runHealthCheck = async () => {
    setError(null);
    await Promise.all([checkApiHealth(), checkNeo4jHealth()]);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      case 'checking': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'checking': return 'Vérification...';
      default: return 'Inconnu';
    }
  };

  return (
    <div className="health-check">
      <div className="health-header">
        <h3>État des services</h3>
        <button onClick={runHealthCheck} className="refresh-button">
          Actualiser
        </button>
      </div>
      
      <div className="health-status">
        <div className="status-item">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor(apiStatus) }}
          ></div>
          <span className="status-label">API FastAPI:</span>
          <span className="status-text">{getStatusText(apiStatus)}</span>
        </div>
        
        <div className="status-item">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor(neo4jStatus) }}
          ></div>
          <span className="status-label">Base de données Neo4j:</span>
          <span className="status-text">{getStatusText(neo4jStatus)}</span>
        </div>
      </div>
      
      {neo4jDetails.message && (
        <div className="neo4j-details">
          <h4>Détails Neo4j:</h4>
          <p><strong>Message:</strong> {neo4jDetails.message}</p>
          <p><strong>Heure:</strong> {neo4jDetails.time}</p>
          <p><strong>URI:</strong> {neo4jDetails.uri}</p>
        </div>
      )}
      
      {error && (
        <div className="health-error">
          <p>Erreur: {error}</p>
        </div>
      )}
    </div>
  );
};

export default HealthCheck;
