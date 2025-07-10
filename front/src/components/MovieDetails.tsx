import React, { useState, useEffect } from 'react';
import { movieApi, handleApiError } from '../api';
import ReviewPanel from './ReviewPanel';
import type { Movie } from '../api';

interface MovieDetailsProps {
  movie: Movie | null;
  onClose: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose }) => {
  const [detailedMovie, setDetailedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);

  const loadMovieDetails = async (title: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.getByTitle(title);
      
      if (response.status === 'success') {
        // L'API retourne les propriétés du film directement dans la réponse
        setDetailedMovie(response);
        
        // Charger les recommandations
        try {
          const recResponse = await movieApi.getRecommendations(title);
          if (recResponse.status === 'success' && recResponse.recommendations && Array.isArray(recResponse.recommendations)) {
            setRecommendations(recResponse.recommendations);
          } else {
            setRecommendations([]);
          }
        } catch (recError) {
          console.log('Erreur lors du chargement des recommandations:', recError);
          setRecommendations([]);
        }
      } else {
        setError(response.message || 'Film non trouvé');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (movie?.title) {
      loadMovieDetails(movie.title);
    }
  }, [movie]);

  if (!movie) return null;

  return (
    <div className="movie-details-overlay">
      <div className="movie-details-modal">
        <div className="movie-details-header">
          <h2>Détails du film</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>
        
        {loading && (
          <div className="loading">
            <div className="spinner">Chargement des détails...</div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => loadMovieDetails(movie.title)} className="retry-button">
              Réessayer
            </button>
          </div>
        )}
        
        {detailedMovie && (
          <div className="movie-details-content">
            <div className="movie-info">
              <h3 className="movie-title">{detailedMovie.title}</h3>
              <p className="movie-year">Année: {detailedMovie.released}</p>
              {detailedMovie.tagline && (
                <p className="movie-tagline">"{detailedMovie.tagline}"</p>
              )}
            </div>
            
            {detailedMovie.directors && Array.isArray(detailedMovie.directors) && detailedMovie.directors.length > 0 && (
              <div className="movie-directors">
                <h4>Réalisateur(s):</h4>
                <ul>
                  {detailedMovie.directors.map((director, index) => (
                    <li key={index}>{director}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {detailedMovie.producers && Array.isArray(detailedMovie.producers) && detailedMovie.producers.length > 0 && (
              <div className="movie-producers">
                <h4>Producteur(s):</h4>
                <ul>
                  {detailedMovie.producers.map((producer, index) => (
                    <li key={index}>{producer}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {detailedMovie.actors && Array.isArray(detailedMovie.actors) && detailedMovie.actors.length > 0 && (
              <div className="movie-cast">
                <h4>Distribution:</h4>
                <div className="cast-grid">
                  {detailedMovie.actors.map((actor, index) => (
                    <div key={index} className="cast-member">
                      <span className="actor-name">{actor.name}</span>
                      {actor.roles && Array.isArray(actor.roles) && actor.roles.length > 0 && (
                        <span className="actor-roles">
                          ({actor.roles.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {Array.isArray(recommendations) && recommendations.length > 0 && (
              <div className="movie-recommendations">
                <h4>Films similaires:</h4>
                <div className="recommendations-grid">
                  {recommendations.map((recMovie, index) => (
                    <div key={index} className="recommendation-card">
                      <h5>{recMovie.title}</h5>
                      <p>{recMovie.released}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ajouter le panneau d'avis */}
            <ReviewPanel movieTitle={detailedMovie.title} />
          </div>
        )}
        
        {detailedMovie?.imageUrl && (
          <div style={{ width: '100%', maxWidth: 400, margin: '0 auto 1.5rem auto', textAlign: 'center' }}>
            <img
              src={detailedMovie.imageUrl}
              alt={detailedMovie.title}
              style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails;
