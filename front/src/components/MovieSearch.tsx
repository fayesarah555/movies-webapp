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
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search color="primary" />
            Recherche de films
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
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un film..."
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
              disabled={loading || !searchTerm.trim()}
              sx={{ 
                minWidth: 120,
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Rechercher'}
            </Button>
          </Box>
        </Paper>

        {/* Erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: 3 
            }}>
              <AnimatePresence>
                {searchResults.map((movie, index) => (
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
                      elevation={3}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent 
                        sx={{ 
                          flexGrow: 1, 
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                        onClick={() => onMovieFound(movie)}
                      >
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
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <IconButton size="small" color="primary" onClick={() => onMovieFound(movie)}>
                          <PlayArrow />
                        </IconButton>
                        
                        {isAdmin && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditMovie(movie)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirm(movie.title)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </CardActions>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
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
