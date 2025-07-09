import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: Date;
}

const ApiMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (isMonitoring) {
      // Intercepter les requêtes pour mesurer les performances
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const [url, options] = args;
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          if (typeof url === 'string' && url.startsWith(API_BASE_URL)) {
            const metric: PerformanceMetric = {
              endpoint: url.replace(API_BASE_URL, ''),
              method: options?.method || 'GET',
              responseTime: Math.round(endTime - startTime),
              status: response.status,
              timestamp: new Date()
            };
            
            setMetrics(prev => [metric, ...prev.slice(0, 19)]); // Garder les 20 dernières métriques
          }
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          
          if (typeof url === 'string' && url.startsWith(API_BASE_URL)) {
            const metric: PerformanceMetric = {
              endpoint: url.replace(API_BASE_URL, ''),
              method: options?.method || 'GET',
              responseTime: Math.round(endTime - startTime),
              status: 0,
              timestamp: new Date()
            };
            
            setMetrics(prev => [metric, ...prev.slice(0, 19)]);
          }
          
          throw error;
        }
      };
      
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [isMonitoring]);

  const clearMetrics = () => {
    setMetrics([]);
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return '#F44336'; // Erreur
    if (status < 300) return '#4CAF50'; // Succès
    if (status < 400) return '#FF9800'; // Redirection
    if (status < 500) return '#F44336'; // Erreur client
    return '#9C27B0'; // Erreur serveur
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 200) return '#4CAF50'; // Rapide
    if (time < 500) return '#FF9800'; // Moyen
    return '#F44336'; // Lent
  };

  const averageResponseTime = metrics.length > 0 
    ? Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length)
    : 0;

  return (
    <div className="api-metrics">
      <div className="metrics-header">
        <h3>📊 Métriques de Performance API</h3>
        <div className="metrics-controls">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={isMonitoring ? 'stop-monitoring' : 'start-monitoring'}
          >
            {isMonitoring ? 'Arrêter' : 'Démarrer'} le monitoring
          </button>
          <button onClick={clearMetrics} className="clear-metrics">
            Effacer
          </button>
        </div>
      </div>

      {isMonitoring && (
        <div className="monitoring-status">
          <span className="monitoring-indicator">🟢 Monitoring actif</span>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="metrics-summary">
          <div className="summary-item">
            <span className="summary-label">Requêtes totales:</span>
            <span className="summary-value">{metrics.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Temps de réponse moyen:</span>
            <span 
              className="summary-value"
              style={{ color: getResponseTimeColor(averageResponseTime) }}
            >
              {averageResponseTime}ms
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Succès:</span>
            <span className="summary-value">
              {metrics.filter(m => m.status >= 200 && m.status < 300).length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Erreurs:</span>
            <span className="summary-value">
              {metrics.filter(m => m.status >= 400 || m.status === 0).length}
            </span>
          </div>
        </div>
      )}

      <div className="metrics-list">
        {metrics.length === 0 ? (
          <div className="no-metrics">
            <p>Aucune métrique disponible</p>
            <p>Activez le monitoring et utilisez l'application pour voir les métriques</p>
          </div>
        ) : (
          <div className="metrics-table">
            <div className="metrics-header-row">
              <div className="metric-column">Endpoint</div>
              <div className="metric-column">Méthode</div>
              <div className="metric-column">Statut</div>
              <div className="metric-column">Temps</div>
              <div className="metric-column">Heure</div>
            </div>
            {metrics.map((metric, index) => (
              <div key={index} className="metrics-row">
                <div className="metric-column endpoint">{metric.endpoint}</div>
                <div className="metric-column method">{metric.method}</div>
                <div 
                  className="metric-column status"
                  style={{ color: getStatusColor(metric.status) }}
                >
                  {metric.status || 'ERR'}
                </div>
                <div 
                  className="metric-column time"
                  style={{ color: getResponseTimeColor(metric.responseTime) }}
                >
                  {metric.responseTime}ms
                </div>
                <div className="metric-column timestamp">
                  {metric.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiMetrics;
