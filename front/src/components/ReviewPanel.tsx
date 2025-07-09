import React, { useState, useEffect } from 'react';
import { reviewApi, handleApiError } from '../api';
import { useAuth } from '../api';
import type { Review, ReviewInput } from '../api';

interface ReviewPanelProps {
  movieTitle: string;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ movieTitle }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState<ReviewInput>({
    movie_title: movieTitle,
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewApi.getByMovie(movieTitle);
      setReviews(response.reviews);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [movieTitle]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.comment || !newReview.comment.trim()) {
      setError('Veuillez saisir un commentaire');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await reviewApi.add({
        ...newReview,
        movie_title: movieTitle
      });
      
      setNewReview({ movie_title: movieTitle, rating: 5, comment: '' });
      setShowForm(false);
      loadReviews(); // Recharger les avis
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ⭐
      </span>
    ));
  };

  return (
    <div className="review-panel">
      <div className="review-header">
        <h3>💬 Avis sur "{movieTitle}"</h3>
        {isAuthenticated && !isAdmin && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            ✍️ Laisser un avis
          </button>
        )}
        {isAuthenticated && isAdmin && (
          <div className="admin-info">
            ℹ️ Les administrateurs ne peuvent pas laisser d'avis
          </div>
        )}
      </div>

      {showForm && (
        <div className="review-form">
          <h4>Votre avis</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Note :</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${newReview.rating >= star ? 'active' : ''}`}
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Commentaire :</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Partagez votre avis sur ce film..."
                rows={4}
                disabled={submitting}
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Publication...' : 'Publier'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="reviews-list">
        {loading && <div className="loading">Chargement des avis...</div>}
        
        {error && !loading && (
          <div className="error">
            {error}
            <button onClick={loadReviews} className="btn-secondary">
              Réessayer
            </button>
          </div>
        )}
        
        {!loading && reviews.length === 0 && (
          <div className="no-reviews">
            <p>Aucun avis pour ce film.</p>
            {isAuthenticated && (
              <p>Soyez le premier à laisser un avis !</p>
            )}
          </div>
        )}
        
        {reviews.map((review, index) => (
          <div key={index} className="review-item">
            <div className="review-header">
              <strong>{review.username}</strong>
              <div className="review-rating">
                {renderStars(review.rating)}
              </div>
              <span className="review-date">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            
            {review.comment && (
              <div className="review-comment">
                {review.comment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewPanel;
