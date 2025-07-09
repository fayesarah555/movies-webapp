import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';
import { authUtils } from '../auth';
import MovieForm from './MovieForm';
import type { Movie } from '../api';

interface MovieSearchProps {
  onMovieFound: (movie: Movie) => void;
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onMovieFound }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const isAdmin = authUtils.isAdmin();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.search(searchTerm);
      
      if (response.status === 'success') {
        setSearchResults(response.movies);
        if (response.movies.length === 0) {
          setError('Aucun film trouvé pour cette recherche');
        }
      } else {
        setError(response.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
  };

  const handleDeleteMovie = async (title: string) => {
    try {
      const response = await movieApi.delete(title);
      if (response.status === 'success') {
        setSearchResults(results => results.filter(movie => movie.title !== title));
        setDeleteConfirm(null);
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleSaveMovie = (movie: Movie) => {
    setEditingMovie(null);
    setShowCreateForm(false);
    // Rafraîchir la recherche si on a des résultats
    if (searchResults.length > 0) {
      handleSearch(new Event('submit') as any);
    }
    // Optionnel : notifier le parent du nouveau film
    console.log('Film sauvegardé:', movie.title);
  };

  const handleCancelEdit = () => {
    setEditingMovie(null);
    setShowCreateForm(false);
  };

  return (
    <div className="movie-search">
      <div className="search-header">
        <h2>🔍 Recherche de films</h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            ➕ Nouveau film
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="form-overlay">
          <MovieForm
            onSubmit={handleSaveMovie}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {editingMovie && (
        <div className="form-overlay">
          <MovieForm
            movie={editingMovie}
            onSubmit={handleSaveMovie}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un film..."
            className="search-input"
          />
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
          {(searchTerm || searchResults.length > 0) && (
            <button
              type="button"
              onClick={clearSearch}
              className="clear-button"
            >
              Effacer
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="search-error">
          <p>{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Résultats de recherche ({searchResults.length})</h3>
          <div className="results-grid">
            {searchResults.map((movie, index) => (
              <div
                key={`${movie.title}-${index}`}
                className="result-card"
              >
                <div className="result-content" onClick={() => onMovieFound(movie)}>
                  <h4 className="result-title">{movie.title}</h4>
                  <p className="result-year">{movie.released}</p>
                  {movie.tagline && (
                    <p className="result-tagline">"{movie.tagline}"</p>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="result-actions">
                    <button
                      onClick={() => handleEditMovie(movie)}
                      className="btn-edit"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(movie.title)}
                      className="btn-delete"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                )}

                {deleteConfirm === movie.title && (
                  <div className="delete-confirm">
                    <p>Supprimer "{movie.title}" ?</p>
                    <div className="delete-confirm-actions">
                      <button
                        onClick={() => handleDeleteMovie(movie.title)}
                        className="btn-danger"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn-secondary"
                      >
                        Non
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieSearch;
