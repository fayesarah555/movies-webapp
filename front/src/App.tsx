import { useState, useEffect } from 'react';
import MovieList from './components/MovieList';
import MovieDetails from './components/MovieDetails';
import MovieSearch from './components/MovieSearch';
import HealthCheck from './components/HealthCheck';
import ApiTester from './components/ApiTester';
import AdminPanel from './components/AdminPanel';
import AuthHeader from './components/AuthHeader';
import RecommendationSearch from './components/RecommendationSearch';
import StatsPanel from './components/StatsPanel';
import PersonPanel from './components/PersonPanel';
import CollaborationSearch from './components/CollaborationSearch';
import DevTools from './components/DevTools';
import ErrorBoundary, { SimpleErrorFallback } from './components/ErrorBoundary';
import { ProtectedRoute, PermissionGate } from './auth';
import { useAuth } from './api';
import type { Movie } from './api';
import './App.css';

function App() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'search' | 'recommendations' | 'persons' | 'collaborations' | 'stats' | 'devtools' | 'health' | 'tester' | 'admin'>('list');
  const { isAdmin } = useAuth();

  // Rediriger vers la liste si l'utilisateur n'est pas admin et essaie d'accéder aux onglets protégés
  useEffect(() => {
    const adminTabs = ['stats', 'health', 'tester', 'admin', 'devtools'];
    if (adminTabs.includes(activeTab) && !isAdmin) {
      setActiveTab('list');
    }
  }, [activeTab, isAdmin]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleMovieFound = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const closeMovieDetails = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎬 Movies Database</h1>
            <p>Interface de gestion des films avec Neo4j</p>
          </div>
          <AuthHeader />
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'list' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('list')}
        >
          Liste des films
        </button>
        <button 
          className={activeTab === 'search' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('search')}
        >
          Recherche
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommandations
        </button>
        <button 
          className={activeTab === 'persons' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('persons')}
        >
          Acteurs
        </button>
        <button 
          className={activeTab === 'collaborations' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveTab('collaborations')}
        >
          Collaborations
        </button>
        <PermissionGate permission="admin">
          <button 
            className={activeTab === 'stats' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques
          </button>
          <button 
            className={activeTab === 'devtools' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('devtools')}
          >
            Outils dev
          </button>
          <button 
            className={activeTab === 'health' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('health')}
          >
            État des services
          </button>
          <button 
            className={activeTab === 'tester' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('tester')}
          >
            Testeur API
          </button>
          <button 
            className={activeTab === 'admin' ? 'nav-button active' : 'nav-button'}
            onClick={() => setActiveTab('admin')}
          >
            Administration
          </button>
        </PermissionGate>
      </nav>

      <main className="app-main">
        <ErrorBoundary fallback={SimpleErrorFallback}>
          {activeTab === 'list' && (
            <MovieList onMovieSelect={handleMovieSelect} />
          )}
          
          {activeTab === 'search' && (
            <MovieSearch onMovieFound={handleMovieFound} />
          )}
          
          {activeTab === 'recommendations' && (
            <RecommendationSearch />
          )}
          
          {activeTab === 'persons' && (
            <PersonPanel />
          )}
          
          {activeTab === 'collaborations' && (
            <CollaborationSearch />
          )}
          
          {activeTab === 'stats' && (
            <ProtectedRoute requireAdmin={true}>
              <StatsPanel />
            </ProtectedRoute>
          )}
          
          {activeTab === 'devtools' && (
            <ProtectedRoute requireAdmin={true}>
              <DevTools onMovieSelect={handleMovieSelect} />
            </ProtectedRoute>
          )}
          
          {activeTab === 'health' && (
            <ProtectedRoute requireAdmin={true}>
              <HealthCheck />
            </ProtectedRoute>
          )}
          
          {activeTab === 'tester' && (
            <ProtectedRoute requireAdmin={true}>
              <ApiTester />
            </ProtectedRoute>
          )}
          
          {activeTab === 'admin' && (
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          )}
        </ErrorBoundary>
      </main>

      {selectedMovie && (
        <ErrorBoundary fallback={SimpleErrorFallback}>
          <MovieDetails 
            movie={selectedMovie} 
            onClose={closeMovieDetails}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;
