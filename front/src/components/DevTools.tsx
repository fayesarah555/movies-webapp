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
        <h2>🔧 Outils de développement</h2>
        <p>Outils pour tester et déboguer l'API</p>
        
        <div className="sub-nav">
          <button 
            className={activeSubTab === 'all-routes' ? 'sub-nav-button active' : 'sub-nav-button'}
            onClick={() => setActiveSubTab('all-routes')}
          >
            Test complet
          </button>
          <button 
            className={activeSubTab === 'root' ? 'sub-nav-button active' : 'sub-nav-button'}
            onClick={() => setActiveSubTab('root')}
          >
            Status API
          </button>
          <button 
            className={activeSubTab === 'neo4j' ? 'sub-nav-button active' : 'sub-nav-button'}
            onClick={() => setActiveSubTab('neo4j')}
          >
            Test Neo4j
          </button>
          <button 
            className={activeSubTab === 'actor-movies' ? 'sub-nav-button active' : 'sub-nav-button'}
            onClick={() => setActiveSubTab('actor-movies')}
          >
            Films d'acteur
          </button>
          <button 
            className={activeSubTab === 'movie-actors' ? 'sub-nav-button active' : 'sub-nav-button'}
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
