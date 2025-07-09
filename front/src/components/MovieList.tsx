import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  Chip,
  IconButton,
  Skeleton
} from '@mui/material';
import { 
  Movie as MovieIcon, 
  Refresh, 
  PlayArrow, 
  DateRange
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
  const pageSize = 12;

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
        
        if (!append) {
          toast.success(`${response.movies.length} films chargés`);
        }
      } else {
        setError(response.message || 'Erreur lors du chargement des films');
        toast.error(response.message || 'Erreur lors du chargement des films');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
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
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieIcon color="primary" />
            Films
          </Typography>
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: 3 
        }}>
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton variant="text" height={32} />
                <Skeleton variant="text" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={16} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MovieIcon color="primary" />
            Liste des films
            <Chip label={movies.length} color="primary" size="small" sx={{ color: 'white', bgcolor: 'primary.main' }} />
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refresh}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Box>
      </motion.div>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 3 
      }}>
        <AnimatePresence>
          {movies.map((movie, index) => (
            <motion.div
              key={`${movie.title}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[8],
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => onMovieSelect?.(movie)}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {movie.title}
                  </Typography>
                  
                  {movie.released && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <DateRange fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {movie.released}
                      </Typography>
                    </Box>
                  )}
                  
                  {movie.tagline && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontStyle: 'italic',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      "{movie.tagline}"
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton size="small" color="primary">
                      <PlayArrow />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
      
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            onClick={loadMore}
            disabled={loading}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Chargement...
              </>
            ) : (
              'Charger plus'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MovieList;
