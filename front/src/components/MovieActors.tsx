import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';

const MovieActors: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [actors, setActors] = useState<Array<{name: string; roles: string[]}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchMovieActors = async () => {
    if (!movieTitle.trim()) {
      setError('Veuillez entrer le titre d\'un film');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(false);

    try {
      const response = await movieApi.getActors(movieTitle);
      setActors(response.actors);
      setSearchPerformed(true);
    } catch (err) {
      setError(handleApiError(err));
      setActors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMovieActors();
    }
  };

  return (
    <div className="movie-actors">
      <div className="panel">
        <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>Acteurs de film</h2>
        <p style={{ color: '#222', marginBottom: 24 }}>Liste des acteurs pour un film donné</p>
        
        <div className="search-section">
          <div className="form-group">
            <label htmlFor="movieTitle">Titre du film :</label>
            <input
              type="text"
              id="movieTitle"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: The Matrix, Forrest Gump..."
              className="form-input"
            />
          </div>

          <button 
            onClick={searchMovieActors}
            disabled={loading || !movieTitle.trim()}
            className="btn btn-primary"
          >
            {loading ? '🔄 Recherche...' : '🔍 Rechercher'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ Erreur : {error}
          </div>
        )}

        {searchPerformed && actors.length === 0 && !loading && !error && (
          <div className="no-results">
            ℹ️ Aucun acteur trouvé pour "{movieTitle}"
          </div>
        )}

        {actors.length > 0 && (
          <div className="actors-section">
            <h3>🎭 Acteurs de "{movieTitle}" ({actors.length})</h3>
            <div className="actors-grid">
              {actors.map((actor) => (
                <div key={actor.name} className="actor-card">
                  <div className="actor-info">
                    <h4>{actor.name}</h4>
                    {actor.roles && actor.roles.length > 0 && (
                      <div className="actor-roles">
                        <span className="roles-label">Rôles :</span>
                        <ul>
                          {actor.roles.map((role, index) => (
                            <li key={index}>{role}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieActors;
