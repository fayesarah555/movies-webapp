import React, { useState } from 'react';
import { personApi, handleApiError } from '../api';
import type { Movie } from '../api';

interface ActorMoviesProps {
  onMovieSelect?: (movie: Movie) => void;
}

const ActorMovies: React.FC<ActorMoviesProps> = ({ onMovieSelect }) => {
  const [loading, setLoading] = useState(false);
  const [actorName, setActorName] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchActorMovies = async () => {
    if (!actorName.trim()) {
      setError('Veuillez entrer le nom d\'un acteur');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(false);

    try {
      const response = await personApi.getMoviesByActor(actorName);
      setMovies(response.movies);
      setSearchPerformed(true);
    } catch (err) {
      setError(handleApiError(err));
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchActorMovies();
    }
  };

  return (
    <div className="actor-movies">
      <div className="panel">
        <h2>🎭 Films par acteur</h2>
        <p>Recherchez tous les films dans lesquels un acteur a joué</p>
        
        <div className="search-section">
          <div className="form-group">
            <label htmlFor="actorName">Nom de l'acteur :</label>
            <input
              type="text"
              id="actorName"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Tom Hanks, Morgan Freeman..."
              className="form-input"
            />
          </div>

          <button 
            onClick={searchActorMovies}
            disabled={loading || !actorName.trim()}
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

        {searchPerformed && movies.length === 0 && !loading && !error && (
          <div className="no-results">
            ℹ️ Aucun film trouvé pour "{actorName}"
          </div>
        )}

        {movies.length > 0 && (
          <div className="movies-section">
            <h3>🎬 Films de {actorName} ({movies.length})</h3>
            <div className="movies-grid">
              {movies.map((movie) => (
                <div key={movie.title} className="movie-card">
                  <div className="movie-info">
                    <h4>{movie.title}</h4>
                    <p className="movie-year">📅 {movie.released}</p>
                    {movie.tagline && (
                      <p className="movie-tagline">"{movie.tagline}"</p>
                    )}
                  </div>
                  
                  {onMovieSelect && (
                    <button 
                      onClick={() => onMovieSelect(movie)}
                      className="btn btn-secondary btn-sm"
                    >
                      Voir détails
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActorMovies;
