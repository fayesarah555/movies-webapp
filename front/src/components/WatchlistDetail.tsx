import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  Share,
  Movie,
  Public,
  Lock,
  Person,
  DateRange,
  Remove,
  PlayArrow,
  Category,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { watchlistApi, handleApiError } from '../api';
import { useAuth } from '../api';
import type { Watchlist, Movie } from '../api';
import WatchlistForm from './WatchlistForm';

interface WatchlistDetailProps {
  open: boolean;
  onClose: () => void;
  watchlist: Watchlist | null;
  onWatchlistUpdated: (watchlist: Watchlist) => void;
  onWatchlistDeleted: (watchlistId: number) => void;
  onMovieSelect?: (movie: Movie) => void;
}

const WatchlistDetail: React.FC<WatchlistDetailProps> = ({
  open,
  onClose,
  watchlist,
  onWatchlistUpdated,
  onWatchlistDeleted,
  onMovieSelect
}) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [removingMovie, setRemovingMovie] = useState<string | null>(null);
  const { user } = useAuth();

  const isOwner = user?.username === watchlist?.owner_username;

  // Charger les films de la watchlist
  const loadMovies = async () => {
    if (!watchlist?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await watchlistApi.getMovies(watchlist.id);
      setMovies(response.movies);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && watchlist) {
      loadMovies();
    }
  }, [open, watchlist]);

  // Supprimer un film de la watchlist
  const handleRemoveMovie = async (movieTitle: string) => {
    if (!watchlist?.id) return;
    
    try {
      setRemovingMovie(movieTitle);
      await watchlistApi.removeMovie(watchlist.id, movieTitle);
      setMovies(prev => prev.filter(m => m.title !== movieTitle));
      toast.success(`Film "${movieTitle}" retiré de la watchlist`);
    } catch (err) {
      const errorMessage = handleApiError(err);
      toast.error(errorMessage);
    } finally {
      setRemovingMovie(null);
    }
  };

  // Supprimer la watchlist
  const handleDeleteWatchlist = async () => {
    if (!watchlist?.id) return;
    
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer la watchlist "${watchlist.name}" ? Cette action est irréversible.`);
    if (!confirmed) return;
    
    try {
      await watchlistApi.delete(watchlist.id);
      onWatchlistDeleted(watchlist.id);
      onClose();
      toast.success(`Watchlist "${watchlist.name}" supprimée`);
    } catch (err) {
      const errorMessage = handleApiError(err);
      toast.error(errorMessage);
    }
  };

  // Partager la watchlist (copier le lien)
  const handleShare = () => {
    if (!watchlist?.is_public) {
      toast.error('Seules les watchlists publiques peuvent être partagées');
      return;
    }
    
    const url = `${window.location.origin}/watchlists/${watchlist.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lien copié dans le presse-papiers !');
    }).catch(() => {
      toast.error('Erreur lors de la copie du lien');
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      general: '📋', favorites: '❤️', to_watch: '👀', watched: '✅',
      recommendations: '⭐', classics: '🏛️', action: '💥', comedy: '😂',
      drama: '🎭', horror: '😱', sci_fi: '🚀', romance: '💕',
      thriller: '🕵️', documentary: '📹', animation: '🎨', family: '👨‍👩‍👧‍👦',
      music: '🎵', war: '⚔️', western: '🤠', crime: '🔫',
      mystery: '🔍', fantasy: '🧙', adventure: '🗺️', biography: '📚',
      history: '🏺'
    };
    return icons[category] || '📋';
  };

  if (!watchlist) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '70vh',
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(37, 37, 69, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {getCategoryIcon(watchlist.category)}
                {watchlist.name}
              </Typography>
              <Chip
                icon={watchlist.is_public ? <Public /> : <Lock />}
                label={watchlist.is_public ? 'Public' : 'Privé'}
                color={watchlist.is_public ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {watchlist.is_public && (
                <Tooltip title="Partager">
                  <IconButton onClick={handleShare} color="primary">
                    <Share />
                  </IconButton>
                </Tooltip>
              )}
              {isOwner && (
                <>
                  <Tooltip title="Modifier">
                    <IconButton onClick={() => setShowEditForm(true)} color="primary">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton onClick={handleDeleteWatchlist} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Informations de la watchlist */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Créée par <strong>{watchlist.owner_username}</strong>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRange color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(watchlist.created_at).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Catégorie: <strong>{watchlist.category}</strong>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Movie color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {movies.length} film{movies.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {watchlist.description && (
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Description color="primary" />
                    <Typography variant="subtitle2" color="primary">
                      Description
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {watchlist.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
            </Box>

            {/* Films de la watchlist */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Movie color="primary" />
                Films ({movies.length})
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                  <Button size="small" onClick={loadMovies} sx={{ ml: 1 }}>
                    Réessayer
                  </Button>
                </Alert>
              ) : movies.length === 0 ? (
                <Alert severity="info">
                  Cette watchlist ne contient aucun film pour le moment.
                </Alert>
              ) : (
                <List sx={{ bgcolor: 'rgba(37, 37, 69, 0.3)', borderRadius: 2 }}>
                  <AnimatePresence>
                    {movies.map((movie, index) => (
                      <motion.div
                        key={movie.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(99, 102, 241, 0.1)',
                            }
                          }}
                        >
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Movie />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {movie.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {movie.released}
                                </Typography>
                                {movie.tagline && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    "{movie.tagline}"
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {onMovieSelect && (
                                <Tooltip title="Voir les détails">
                                  <IconButton 
                                    onClick={() => onMovieSelect(movie)}
                                    color="primary"
                                    size="small"
                                  >
                                    <PlayArrow />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isOwner && (
                                <Tooltip title="Retirer de la watchlist">
                                  <IconButton
                                    onClick={() => handleRemoveMovie(movie.title)}
                                    color="error"
                                    size="small"
                                    disabled={removingMovie === movie.title}
                                  >
                                    {removingMovie === movie.title ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <Remove />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < movies.length - 1 && <Divider />}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </Box>
          </motion.div>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Formulaire d'édition */}
      {showEditForm && (
        <WatchlistForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={(updatedWatchlist) => {
            onWatchlistUpdated(updatedWatchlist);
            setShowEditForm(false);
          }}
          watchlist={watchlist}
          mode="edit"
        />
      )}
    </>
  );
};

export default WatchlistDetail;