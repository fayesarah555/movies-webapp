import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';
// import { useAuth } from '../auth'; // Pourrait être utilisé pour pré-remplir le champ utilisateur

interface RecommendationSearchProps {
  className?: string;
}

const RecommendationSearch: React.FC<RecommendationSearchProps> = ({ className = '' }) => {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'user'>('movie');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseTitle, setBaseTitle] = useState('');
  const [targetUser, setTargetUser] = useState('');
  
  // const { username: currentUsername } = useAuth(); // Pourrait être utilisé pour pré-remplir le champ utilisateur

  const searchRecommendations = async () => {
    if (searchType === 'movie' && !searchTitle.trim()) {
      setError('Veuillez entrer un titre de film');
      return;
    }
    
    if (searchType === 'user' && !searchUsername.trim()) {
      setError('Veuillez entrer un nom d\'utilisateur');
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]);

    try {
      if (searchType === 'movie') {
        const response = await movieApi.getRecommendations(searchTitle.trim(), 10);
        if (response.status === 'success') {
          setRecommendations(response.recommendations);
          setBaseTitle(response.base_title);
        } else {
          setError('Aucune recommandation trouvée pour ce film');
        }
      } else {
        const response = await movieApi.getUserRecommendations(searchUsername.trim(), 10);
        if (response.status === 'success') {
          setRecommendations(response.recommendations);
          setTargetUser(response.user);
        } else {
          setError('Aucune recommandation trouvée pour cet utilisateur');
        }
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchRecommendations();
    }
  };

  return (
    <div className={`recommendation-search ${className}`}>
      <h2>🔍 Recherche de Recommandations</h2>
      
      <div className="search-type-selector">
        <label>
          <input
            type="radio"
            value="movie"
            checked={searchType === 'movie'}
            onChange={(e) => setSearchType(e.target.value as 'movie')}
          />
          Films similaires
        </label>
        <label>
          <input
            type="radio"
            value="user"
            checked={searchType === 'user'}
            onChange={(e) => setSearchType(e.target.value as 'user')}
          />
          Recommandations utilisateur
        </label>
      </div>

      <div className="search-controls">
        {searchType === 'movie' ? (
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Titre du film de référence..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={searchRecommendations} disabled={loading}>
              {loading ? '🔄' : '🎬'} Recommander
            </button>
          </div>
        ) : (
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Nom d'utilisateur..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={searchRecommendations} disabled={loading}>
              {loading ? '🔄' : '👤'} Recommander
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendations-results">
          <h3>
            {searchType === 'movie' 
              ? `🎯 Films similaires à "${baseTitle}"` 
              : `🎯 Recommandations pour "${targetUser}"`
            }
          </h3>
          <div className="recommendations-grid">
            {recommendations.map((movie, index) => (
              <div key={index} className="recommendation-card">
                <h4>{movie.title}</h4>
                <div className="movie-details">
                  <span className="release-year">📅 {movie.released}</span>
                  {movie.score && (
                    <span className="recommendation-score">
                      ⭐ Score: {movie.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Recherche de recommandations...</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationSearch;
