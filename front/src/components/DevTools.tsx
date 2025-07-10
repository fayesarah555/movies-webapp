import React, { useState } from 'react';
import Neo4jTest from './Neo4jTest';
import RootStatus from './RootStatus';
import ActorMovies from './ActorMovies';
import MovieActors from './MovieActors';
import AllRoutesTester from './AllRoutesTester';
import type { Movie } from '../api';

interface DevToolsProps {
  onMovieSelect?: (movie: Movie) => void;
}

const DevTools: React.FC<DevToolsProps> = ({ onMovieSelect }) => {
  const [activeSubTab, setActiveSubTab] = useState<'all-routes' | 'root' | 'neo4j' | 'items' | 'actor-movies' | 'movie-actors'>('all-routes');

  return (
    <div className="dev-tools">
      <div className="panel">
        <h2 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>🔧 Outils de développement</h2>
        <p style={{ color: '#222', marginBottom: 24 }}>Outils pour tester et déboguer l'API</p>
        <div className="sub-nav" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button 
            className={activeSubTab === 'all-routes' ? 'sub-nav-button active' : 'sub-nav-button'}
            style={{ color: activeSubTab === 'all-routes' ? '#fff' : '#1976d2', background: activeSubTab === 'all-routes' ? '#1976d2' : undefined, fontWeight: 600, borderRadius: 6, padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('all-routes')}
          >
            Test complet
          </button>
          <button 
            className={activeSubTab === 'root' ? 'sub-nav-button active' : 'sub-nav-button'}
            style={{ color: activeSubTab === 'root' ? '#fff' : '#1976d2', background: activeSubTab === 'root' ? '#1976d2' : undefined, fontWeight: 600, borderRadius: 6, padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('root')}
          >
            Status API
          </button>
          <button 
            className={activeSubTab === 'neo4j' ? 'sub-nav-button active' : 'sub-nav-button'}
            style={{ color: activeSubTab === 'neo4j' ? '#fff' : '#1976d2', background: activeSubTab === 'neo4j' ? '#1976d2' : undefined, fontWeight: 600, borderRadius: 6, padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('neo4j')}
          >
            Test Neo4j
          </button>
          <button 
            className={activeSubTab === 'actor-movies' ? 'sub-nav-button active' : 'sub-nav-button'}
            style={{ color: activeSubTab === 'actor-movies' ? '#fff' : '#1976d2', background: activeSubTab === 'actor-movies' ? '#1976d2' : undefined, fontWeight: 600, borderRadius: 6, padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('actor-movies')}
          >
            Films d'acteur
          </button>
          <button 
            className={activeSubTab === 'movie-actors' ? 'sub-nav-button active' : 'sub-nav-button'}
            style={{ color: activeSubTab === 'movie-actors' ? '#fff' : '#1976d2', background: activeSubTab === 'movie-actors' ? '#1976d2' : undefined, fontWeight: 600, borderRadius: 6, padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('movie-actors')}
          >
            Acteurs de film
          </button>
        </div>
        <div className="sub-content">
          {activeSubTab === 'all-routes' && <AllRoutesTester />}
          {activeSubTab === 'root' && <RootStatus />}
          {activeSubTab === 'neo4j' && <Neo4jTest />}
          {activeSubTab === 'actor-movies' && <ActorMovies onMovieSelect={onMovieSelect} />}
          {activeSubTab === 'movie-actors' && <MovieActors />}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
