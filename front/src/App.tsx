import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, Tabs, Tab, Container } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { theme } from './theme';
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
import { AuthProvider } from './AuthContext';

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

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue as typeof activeTab);
  };

  const tabs = [
    { value: 'list', label: 'Liste des films', icon: '🎬' },
    { value: 'search', label: 'Recherche', icon: '🔍' },
    { value: 'recommendations', label: 'Recommandations', icon: '⭐' },
    { value: 'persons', label: 'Acteurs', icon: '👥' },
    { value: 'collaborations', label: 'Collaborations', icon: '🤝' },
  ];

  const adminTabs = [
    { value: 'stats', label: 'Statistiques', icon: '📊' },
    { value: 'devtools', label: 'Outils dev', icon: '⚙️' },
    { value: 'health', label: 'État des services', icon: '🏥' },
    { value: 'tester', label: 'Testeur API', icon: '🧪' },
    { value: 'admin', label: 'Administration', icon: '👨‍💼' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={2}>
          <Toolbar>
            <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              🎬MovieRank
            </Typography>
            <Typography variant="subtitle1" sx={{ mr: 2, opacity: 0.8 }}>
              Interface de gestion des films avec Neo4j
            </Typography>
            <AuthHeader />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  '& .MuiTab-root': { 
                    textTransform: 'none',
                    minWidth: 120,
                    fontSize: '0.95rem'
                  }
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </Box>
                    }
                  />
                ))}
                {adminTabs.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </Box>
                    }
                    disabled={!isAdmin}
                  />
                ))}
              </Tabs>
            </Box>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </Container>

        {selectedMovie && (
          <ErrorBoundary fallback={SimpleErrorFallback}>
            <MovieDetails 
              movie={selectedMovie} 
              onClose={closeMovieDetails}
            />
          </ErrorBoundary>
        )}
      </Box>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;
