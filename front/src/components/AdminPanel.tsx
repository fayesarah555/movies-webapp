import React, { useState, useEffect } from 'react';
import { movieApi, handleApiError } from '../api';
import type { Movie } from '../api';
import MovieForm from './MovieForm';

const AdminPanel: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.getAll(50, 0); // Charger plus de films pour l'admin
      
      if (response.status === 'success') {
        setMovies(response.movies);
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
    loadMovies();
  }, []);

  const handleCreateMovie = () => {
    setEditingMovie(null);
    setShowForm(true);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleSaveMovie = (_movie: Movie) => {
    setShowForm(false);
    setEditingMovie(null);
    loadMovies(); // Recharger la liste
  };

  const handleDeleteMovie = async (title: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.delete(title);
      
      if (response.status === 'success') {
        setMovies(prev => prev.filter(m => m.title !== title));
        setDeleteConfirm(null);
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMovie(null);
  };

  const getUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.role;
    }
    return 'user';
  };

  const isAdmin = getUserRole() === 'admin';

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>🚫 Accès refusé</h2>
          <p>Vous devez être administrateur pour accéder à cette section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>⚙️ Panel d'administration</h2>
        <button onClick={handleCreateMovie} className="create-movie-button">
          ➕ Nouveau film
        </button>
      </div>

      {loading && movies.length === 0 && (
        <div className="loading">
          <div className="spinner">Chargement des films...</div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadMovies} className="retry-button">
            Réessayer
          </button>
        </div>
      )}

      <div className="movies-table">
        <div className="table-header">
          <div className="table-column">Titre</div>
          <div className="table-column">Année</div>
          <div className="table-column">Tagline</div>
          <div className="table-column">Actions</div>
        </div>
        
        {movies.map((movie, index) => (
          <div key={index} className="table-row">
            <div className="table-column movie-title">{movie.title}</div>
            <div className="table-column">{movie.released}</div>
            <div className="table-column movie-tagline">
              {movie.tagline || '-'}
            </div>
            <div className="table-column actions">
              <button
                onClick={() => handleEditMovie(movie)}
                className="edit-button"
                disabled={loading}
              >
                ✏️
              </button>
              <button
                onClick={() => setDeleteConfirm(movie.title)}
                className="delete-button"
                disabled={loading}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <MovieForm
          movie={editingMovie || undefined}
          onSave={handleSaveMovie}
          onCancel={handleCancelForm}
        />
      )}

      {deleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer le film "{deleteConfirm}" ?</p>
            <div className="confirm-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cancel-button"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteMovie(deleteConfirm)}
                className="confirm-delete-button"
                disabled={loading}
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
