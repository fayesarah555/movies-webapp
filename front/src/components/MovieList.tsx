import React, { useState, useEffect } from 'react';
import { movieApi, handleApiError } from '../api';
import type { Movie } from '../api';

interface MovieListProps {
  onMovieSelect?: (movie: Movie) => void;
}

const MovieList: React.FC<MovieListProps> = ({ onMovieSelect }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const loadMovies = async (page: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.getAll(pageSize, page * pageSize);
      
      if (response.status === 'success') {
        if (append) {
          setMovies(prev => [...prev, ...response.movies]);
        } else {
          setMovies(response.movies);
        }
        setHasMore(response.movies.length === pageSize);
      } else {
        setError(response.message || 'Erreur lors du chargement des films');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies(0);
  }, []);

  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadMovies(nextPage, true);
  };

  const refresh = () => {
    setCurrentPage(0);
    loadMovies(0);
  };

  if (loading && movies.length === 0) {
    return (
      <div className="movie-list loading">
        <div className="spinner">Chargement des films...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-list error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={refresh} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-list">
      <div className="movie-list-header">
        <h2>Films ({movies.length})</h2>
        <button onClick={refresh} className="refresh-button">
          Actualiser
        </button>
      </div>
      
      <div className="movies-grid">
        {movies.map((movie, index) => (
          <div
            key={`${movie.title}-${index}`}
            className="movie-card"
            onClick={() => onMovieSelect?.(movie)}
          >
            <div className="movie-info">
              <h3 className="movie-title">{movie.title}</h3>
              <p className="movie-year">{movie.released}</p>
              {movie.tagline && (
                <p className="movie-tagline">"{movie.tagline}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more-container">
          <button
            onClick={loadMore}
            disabled={loading}
            className="load-more-button"
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MovieList;
