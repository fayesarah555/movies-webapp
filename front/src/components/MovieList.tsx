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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 2, sm: 0 }, mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: { xs: 2, sm: 0 } }}>
          <MovieIcon sx={{ mr: 1 }} /> Liste des films
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refresh}
          disabled={loading}
          sx={{ color: 'primary.main', borderColor: 'primary.main', bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}
        >
          {loading ? <CircularProgress size={16} /> : 'Actualiser'}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
        mb: 3
      }}>
        {loading && movies.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
          ))
        ) : (
          <AnimatePresence>
            {movies.map((movie) => (
              <motion.div
                key={movie.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                style={{ display: 'flex' }}
              >
                <Card sx={{ width: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 180 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mb: 1 }}>
                      {movie.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip icon={<DateRange />} label={movie.released} size="small" color="primary" variant="outlined" />
                    </Box>
                    {movie.tagline && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                        "{movie.tagline}"
                      </Typography>
                    )}
                    {onMovieSelect && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onMovieSelect(movie)}
                        sx={{ mt: 1 }}
                        endIcon={<PlayArrow />}
                      >
                        Voir détails
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
      {hasMore && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button variant="contained" onClick={loadMore} sx={{ fontWeight: 600 }}>
            Charger plus
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MovieList;
