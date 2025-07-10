import React, { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlaylistAdd,
  Add,
  Check,
  Bookmark,
  BookmarkBorder,
  Public,
  Lock,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { watchlistApi, handleApiError } from '../api';
import { useAuth } from '../api';
import type { Watchlist } from '../api';
import WatchlistForm from './WatchlistForm';

interface AddToWatchlistButtonProps {
  movieTitle: string;
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  disabled?: boolean;
  fullWidth?: boolean;
}

const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  movieTitle,
  variant = 'button',
  size = 'medium',
  color = 'primary',
  disabled = false,
  fullWidth = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [movieWatchlists, setMovieWatchlists] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState<number | null>(null);
  const { isAuthenticated, user } = useAuth();

  const open = Boolean(anchorEl);

  // Charger les watchlists de l'utilisateur
  const loadUserWatchlists = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger toutes les watchlists de l'utilisateur
      const response = await watchlistApi.getUserWatchlists();
      setWatchlists(response.watchlists);
      
      // Charger les watchlists qui contiennent déjà ce film
      const movieWatchlistsResponse = await watchlistApi.getMovieWatchlists(movieTitle);
      setMovieWatchlists(movieWatchlistsResponse.watchlist_ids);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Erreur chargement watchlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isAuthenticated) {
      loadUserWatchlists();
    }
  }, [open, isAuthenticated, movieTitle]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isAuthenticated) {
      toast.error('Vous devez être connecté pour ajouter des films aux watchlists');
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setError(null);
  };

  const handleAddToWatchlist = async (watchlistId: number) => {
    try {
      setAddingToWatchlist(watchlistId);
      await watchlistApi.addMovie(watchlistId, movieTitle);
      
      // Mettre à jour la liste des watchlists qui contiennent le film
      setMovieWatchlists(prev => [...prev, watchlistId]);
      
      const watchlist = watchlists.find(w => w.id === watchlistId);
      toast.success(`Film ajouté à "${watchlist?.name}" !`);
    } catch (err) {
      const errorMessage = handleApiError(err);
      toast.error(errorMessage);
    } finally {
      setAddingToWatchlist(null);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: number) => {
    try {
      setAddingToWatchlist(watchlistId);
      await watchlistApi.removeMovie(watchlistId, movieTitle);
      
      // Mettre à jour la liste des watchlists qui contiennent le film
      setMovieWatchlists(prev => prev.filter(id => id !== watchlistId));
      
      const watchlist = watchlists.find(w => w.id === watchlistId);
      toast.success(`Film retiré de "${watchlist?.name}" !`);
    } catch (err) {
      const errorMessage = handleApiError(err);
      toast.error(errorMessage);
    } finally {
      setAddingToWatchlist(null);
    }
  };

  const handleCreateNewWatchlist = (newWatchlist: Watchlist) => {
    setWatchlists(prev => [...prev, newWatchlist]);
    setShowCreateForm(false);
    
    // Ajouter automatiquement le film à la nouvelle watchlist
    handleAddToWatchlist(newWatchlist.id);
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

  if (!isAuthenticated) {
    return null; // Ne pas afficher le bouton si non connecté
  }

  const isInAnyWatchlist = movieWatchlists.length > 0;

  const buttonContent = variant === 'icon' ? (
    <Tooltip title={isInAnyWatchlist ? 'Gérer les watchlists' : 'Ajouter à une watchlist'}>
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        color={color}
        size={size}
        sx={{
          '&:hover': {
            transform: 'scale(1.1)',
          }
        }}
      >
        {isInAnyWatchlist ? <Bookmark /> : <BookmarkBorder />}
      </IconButton>
    </Tooltip>
  ) : (
    <Button
      onClick={handleClick}
      disabled={disabled}
      color={color}
      size={size}
      fullWidth={fullWidth}
      variant={isInAnyWatchlist ? 'contained' : 'outlined'}
      startIcon={isInAnyWatchlist ? <Bookmark /> : <PlaylistAdd />}
      sx={{
        '&:hover': {
          transform: 'translateY(-2px)',
        }
      }}
    >
      {isInAnyWatchlist ? 'Dans vos listes' : 'Ajouter à une liste'}
    </Button>
  );

  return (
    <>
      {buttonContent}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: 2,
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Ajouter à une watchlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            "{movieTitle}"
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" size="small">
              {error}
            </Alert>
          </Box>
        ) : (
          <>
            {/* Bouton créer nouvelle watchlist */}
            <MenuItem onClick={() => setShowCreateForm(true)}>
              <ListItemIcon>
                <Add color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Créer une nouvelle watchlist"
                secondary="Créer et ajouter le film"
              />
            </MenuItem>

            {watchlists.length > 0 && <Divider />}

            {/* Liste des watchlists existantes */}
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <AnimatePresence>
                {watchlists.map((watchlist) => {
                  const isInWatchlist = movieWatchlists.includes(watchlist.id);
                  const isProcessing = addingToWatchlist === watchlist.id;

                  return (
                    <motion.div
                      key={watchlist.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MenuItem
                        onClick={() => 
                          isInWatchlist 
                            ? handleRemoveFromWatchlist(watchlist.id)
                            : handleAddToWatchlist(watchlist.id)
                        }
                        disabled={isProcessing}
                        sx={{
                          bgcolor: isInWatchlist ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        }}
                      >
                        <ListItemIcon>
                          {isProcessing ? (
                            <CircularProgress size={20} />
                          ) : isInWatchlist ? (
                            <Check color="success" />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>
                              {getCategoryIcon(watchlist.category)}
                            </span>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {watchlist.name}
                              </Typography>
                              <Chip
                                icon={watchlist.is_public ? <Public /> : <Lock />}
                                label={watchlist.is_public ? 'Public' : 'Privé'}
                                size="small"
                                variant="outlined"
                                sx={{ height: 16, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {watchlist.movie_count} film{watchlist.movie_count > 1 ? 's' : ''}
                            </Typography>
                          }
                        />
                      </MenuItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>

            {watchlists.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Vous n'avez pas encore de watchlist.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Menu>

      {/* Formulaire de création de watchlist */}
      <WatchlistForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateNewWatchlist}
        mode="create"
      />
    </>
  );
};

export default AddToWatchlistButton;