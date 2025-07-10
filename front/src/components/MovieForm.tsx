import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';
import type { Movie } from '../api';

interface MovieFormProps {
  movie?: Movie;
  onSave: (movie: Movie) => void;
  onCancel: () => void;
}

const MovieForm: React.FC<MovieFormProps> = ({ movie, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: movie?.title || '',
    released: movie?.released || new Date().getFullYear(),
    tagline: movie?.tagline || '',
    directors: movie?.directors?.join(', ') || '',
    producers: movie?.producers?.join(', ') || '',
    actors: movie?.actors?.map(a => `${a.name} (${a.roles.join(', ')})`).join('; ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const movieData: Partial<Movie> = {
        title: formData.title,
        released: formData.released,
        tagline: formData.tagline,
        directors: formData.directors.split(',').map(d => d.trim()).filter(d => d),
        producers: formData.producers.split(',').map(p => p.trim()).filter(p => p),
        actors: formData.actors.split(';').map(a => {
          const match = a.trim().match(/^(.+?)\s*\((.+?)\)$/);
          if (match) {
            return {
              name: match[1].trim(),
              roles: match[2].split(',').map(r => r.trim())
            };
          }
          return { name: a.trim(), roles: [] };
        }).filter(a => a.name)
      };
      
      let response;
      if (movie) {
        // Mise à jour
        response = await movieApi.update(movie.title, movieData);
      } else {
        // Création
        response = await movieApi.create(movieData);
      }
      
      if (response.status === 'success' && response.data) {
        onSave(response.data);
      } else {
        setError(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="movie-form-overlay">
      <div className="movie-form-modal">
        <div className="movie-form-header">
          <h2>{movie ? '✏️ Modifier le film' : '➕ Nouveau film'}</h2>
          <button onClick={onCancel} className="close-button">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="movie-form">
          <div className="form-group">
            <label htmlFor="title">Titre *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Titre du film"
              className="form-input"
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="released">Année de sortie</label>
            <input
              id="released"
              type="number"
              value={formData.released}
              onChange={(e) => handleInputChange('released', parseInt(e.target.value))}
              placeholder="Année de sortie"
              className="form-input"
              disabled={loading}
              min="1900"
              max={new Date().getFullYear() + 10}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tagline">Tagline</label>
            <input
              id="tagline"
              type="text"
              value={formData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              placeholder="Tagline du film"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="directors">Réalisateurs</label>
            <input
              id="directors"
              type="text"
              value={formData.directors}
              onChange={(e) => handleInputChange('directors', e.target.value)}
              placeholder="Réalisateurs (séparés par des virgules)"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="producers">Producteurs</label>
            <input
              id="producers"
              type="text"
              value={formData.producers}
              onChange={(e) => handleInputChange('producers', e.target.value)}
              placeholder="Producteurs (séparés par des virgules)"
              className="form-input"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="actors">Acteurs</label>
            <textarea
              id="actors"
              value={formData.actors}
              onChange={(e) => handleInputChange('actors', e.target.value)}
              placeholder="Acteurs au format: Nom (rôle1, rôle2); Nom2 (rôle3)"
              className="form-textarea"
              disabled={loading}
              rows={3}
            />
          </div>
          
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : (movie ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovieForm;
