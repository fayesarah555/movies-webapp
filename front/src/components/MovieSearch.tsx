import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  CircularProgress,
  Fab,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  Clear,
  Movie as MovieIcon,
  Add,
  Edit,
  Delete,
  DateRange,
  PlayArrow,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { movieApi, handleApiError } from '../api';
import { authUtils } from '../auth';
import MovieForm from './MovieForm';
import type { Movie } from '../api';

interface MovieSearchProps {
  onMovieFound: (movie: Movie) => void;
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onMovieFound }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const theme = useTheme();
  
  const isAdmin = authUtils.isAdmin();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await movieApi.search(searchTerm);
      
      if (response.status === 'success') {
        setSearchResults(response.movies);
        if (response.movies.length === 0) {
          setError('Aucun film trouvé pour cette recherche');
        } else {
          toast.success(`${response.movies.length} film(s) trouvé(s)`);
        }
      } else {
        const errorMessage = response.message || 'Erreur lors de la recherche';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
  };

  const handleDeleteMovie = async (title: string) => {
    try {
      const response = await movieApi.delete(title);
      if (response.status === 'success') {
        setSearchResults(results => results.filter(movie => movie.title !== title));
        setDeleteConfirm(null);
        toast.success(`Film "${title}" supprimé avec succès`);
      } else {
        const errorMessage = response.message || 'Erreur lors de la suppression';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSaveMovie = (movie: Movie) => {
    setEditingMovie(null);
    setShowCreateForm(false);
    // Rafraîchir la recherche si on a des résultats
    if (searchResults.length > 0) {
      handleSearch(new Event('submit') as any);
    }
    toast.success(`Film "${movie.title}" sauvegardé avec succès`);
  };

  const handleCancelEdit = () => {
    setEditingMovie(null);
    setShowCreateForm(false);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2, md: 4 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 2, sm: 0 }, mb: 3 }}>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: { xs: 2, sm: 0 } }}>
            <MovieIcon sx={{ mr: 1 }} /> Recherche de films
            <Chip label={searchResults.length} color="primary" size="small" sx={{ color: 'white', bgcolor: 'primary.main' }} />
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                }
              }}
            >
              Nouveau film
            </Button>
          )}
        </Box>

        {/* Formulaire de recherche */}
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField
            label="Titre du film"
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            fullWidth
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 160, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Rechercher'}
          </Button>
        </Box>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MovieIcon color="primary" />
              Résultats de recherche
              <Chip label={searchResults.length} color="primary" size="small" />
            </Typography>
            
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
              mb: 3
            }}>
              {loading && searchResults.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} sx={{ borderRadius: 2, minHeight: 180, opacity: 0.5 }} />
                ))
              ) : (
                <AnimatePresence>
                  {searchResults.map((movie) => (
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
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onMovieFound(movie)}
                            sx={{ mt: 1 }}
                            endIcon={<PlayArrow />}
                          >
                            Voir détails
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </Box>
          </motion.div>
        )}

        {/* Formulaire de création */}
        <Dialog 
          open={showCreateForm} 
          onClose={handleCancelEdit}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              minHeight: '60vh'
            }
          }}
        >
          <MovieForm
            onSubmit={handleSaveMovie}
            onCancel={handleCancelEdit}
          />
        </Dialog>

        {/* Formulaire d'édition */}
        <Dialog 
          open={!!editingMovie} 
          onClose={handleCancelEdit}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              minHeight: '60vh'
            }
          }}
        >
          <MovieForm
            movie={editingMovie || undefined}
            onSubmit={handleSaveMovie}
            onCancel={handleCancelEdit}
          />
        </Dialog>

        {/* Confirmation de suppression */}
        <Dialog 
          open={!!deleteConfirm} 
          onClose={() => setDeleteConfirm(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete color="error" />
              Confirmer la suppression
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Êtes-vous sûr de vouloir supprimer le film <strong>"{deleteConfirm}"</strong> ?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDeleteMovie(deleteConfirm)}
              color="error"
              variant="contained"
              startIcon={<Delete />}
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* FAB pour créer un nouveau film */}
        {isAdmin && (
          <Tooltip title="Nouveau film">
            <Fab
              color="primary"
              onClick={() => setShowCreateForm(true)}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Add />
            </Fab>
          </Tooltip>
        )}
      </motion.div>
    </Box>
  );
};

export default MovieSearch;
