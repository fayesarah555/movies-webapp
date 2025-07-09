import React, { useState, useEffect } from 'react';
import { statsApi, handleApiError } from '../api';
import type { DatabaseStats } from '../api';

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statsApi.getStats();
      
      if (response.status === 'success') {
        setStats(response.stats);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="stats-panel">
        <div className="loading">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-panel">
        <div className="error">{error}</div>
        <button onClick={loadStats} className="btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-panel">
        <div className="info">Aucune statistique disponible</div>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h2>📊 Statistiques de la base de données</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-content">
            <h3>Films</h3>
            <p className="stat-number">{stats.movies_count}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Acteurs</h3>
            <p className="stat-number">{stats.persons_count}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎭</div>
          <div className="stat-content">
            <h3>Acteurs</h3>
            <p className="stat-number">{stats.relationships.acted_in}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-content">
            <h3>Réalisateurs</h3>
            <p className="stat-number">{stats.relationships.directed}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎪</div>
          <div className="stat-content">
            <h3>Producteurs</h3>
            <p className="stat-number">{stats.relationships.produced}</p>
          </div>
        </div>
      </div>
      
      {stats.latest_movie && (
        <div className="latest-movie">
          <h3>🆕 Film le plus récent</h3>
          <div className="movie-info">
            <strong>{stats.latest_movie.title}</strong> ({stats.latest_movie.released})
          </div>
        </div>
      )}
      
      <div className="stats-actions">
        <button onClick={loadStats} className="btn-secondary">
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default StatsPanel;
