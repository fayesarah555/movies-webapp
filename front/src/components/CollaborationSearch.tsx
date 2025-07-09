import React, { useState } from 'react';
import { collaborationApi, handleApiError } from '../api';
import type { Collaboration } from '../api';

const CollaborationSearch: React.FC = () => {
  const [person1, setPerson1] = useState('');
  const [person2, setPerson2] = useState('');
  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!person1.trim() || !person2.trim()) {
      setError('Veuillez saisir les noms des deux personnes');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCollaboration(null);
      
      const response = await collaborationApi.getCollaborations(person1, person2);
      
      if (response.person1 && response.person2) {
        setCollaboration(response);
      } else {
        setError('Aucune collaboration trouvée');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="collaboration-search">
      <h2>🤝 Recherche de collaborations</h2>
      <p>Découvrez les films en commun entre deux personnes</p>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="person1">Première personne :</label>
            <input
              id="person1"
              type="text"
              value={person1}
              onChange={(e) => setPerson1(e.target.value)}
              placeholder="Nom de la première personne"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="person2">Seconde personne :</label>
            <input
              id="person2"
              type="text"
              value={person2}
              onChange={(e) => setPerson2(e.target.value)}
              placeholder="Nom de la seconde personne"
              disabled={loading}
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Recherche...' : '🔍 Rechercher les collaborations'}
        </button>
      </form>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      
      {collaboration && (
        <div className="collaboration-results">
          <h3>Résultats de la collaboration</h3>
          
          <div className="collaboration-summary">
            <div className="persons">
              <span className="person">{collaboration.person1}</span>
              <span className="collaboration-icon">🤝</span>
              <span className="person">{collaboration.person2}</span>
            </div>
            
            <div className="collaboration-count">
              <strong>{collaboration.collaborations}</strong> film(s) en commun
            </div>
          </div>
          
          {collaboration.movies.length > 0 && (
            <div className="movies-list">
              <h4>Films en commun :</h4>
              <ul>
                {collaboration.movies.map((movie, index) => (
                  <li key={index} className="movie-item">
                    🎬 {movie}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {collaboration.similarity1 && collaboration.similarity2 && (
            <div className="similarity-info">
              <h4>Précision de la recherche :</h4>
              <div className="similarity-scores">
                <div className="similarity-score">
                  <strong>{collaboration.person1}:</strong> {(collaboration.similarity1 * 100).toFixed(1)}%
                </div>
                <div className="similarity-score">
                  <strong>{collaboration.person2}:</strong> {(collaboration.similarity2 * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaborationSearch;
