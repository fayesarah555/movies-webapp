import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlaylistAdd,
  Visibility,
  VisibilityOff,
  Delete,
  Edit,
  Add,
  Movie,
  Public,
  Lock,
  MoreVert,
  DateRange,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { watchlistApi, useWatchlists, handleApiError } from '../api';
import type { Watchlist, WatchlistDetail } from '../api';
import WatchlistForm from './WatchlistForm';
import WatchlistDetail from './WatchlistDetail';

const WatchlistPanel: React.FC = () => {
  const {
    watchlists,
    loading,
    error,
    loadWatchlists,
    createWatchlist,
    deleteWatchlist,
  } = useWatchlists();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [selectedWatchlist, setSelectedWatchlist] = useState<WatchlistDetail | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [publicWatchlists, setPublicWatchlists] = useState<Watchlist[]>([]);
  const [showPublic, setShowPublic] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuWatchlistId, setMenuWatchlistId] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    loadWatchlists();
    loadPublicWatchlists();
  }, []);

  const loadPublicWatchlists = async () => {
    try {
      const data = await watchlistApi.getPublicWatchlists(10, 0);
      setPublicWatchlists(data);
    } catch (err) {
      console.error('Erreur lors du chargement des watchlists publiques:', err);
    }
  };

  const handleCreateWatchlist = async (watchlistData: any) => {
    try {
      await createWatchlist(watchlistData);
      setShowCreateForm(false);
      toast.success('Watchlist créée avec succès !');
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleEditWatchlist = async (watchlistData: any) => {
    if (!editingWatchlist) return;
    
    try {
      await watchlistApi.update(editingWatchlist.id, watchlistData);
      setEditingWatchlist(null);
      loadWatchlists();
      toast.success('Watchlist mise à jour avec succès !');
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleDeleteWatchlist = async (watchlistId: string) => {
    try {
      await deleteWatchlist(watchlistId);
      setDeleteConfirm(null);
      toast.success('Watchlist supprimée avec succès !');
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleViewWatchlist = async (watchlistId: string) => {
    try {
      const detail = await watchlistApi.getWatchlistDetail(watchlistId);
      setSelectedWatchlist(detail);
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, watchlistId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuWatchlistId(watchlistId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuWatchlistId(null);
  };

  const WatchlistCard: React.FC<{ watchlist: Watchlist; isOwner?: boolean }> = ({ 
    watchlist, 
    isOwner = true 
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {watchlist.name}
            </Typography>
            {isOwner && (
              <IconButton
                size="small"
                onClick={(e) => handleMenuClick(e, watchlist.id)}
              >
                <MoreVert />
              </IconButton>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={watchlist.is_public ? <Public /> : <Lock />}
              label={watchlist.is_public ? 'Publique' : 'Privée'}
              size="small"
              color={watchlist.is_public ? 'success' : 'default'}
              variant="outlined"
            />
            <Chip
              icon={<Movie />}
              label={`${watchlist.movie_count} films`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {watchlist.description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              {watchlist.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DateRange fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              Créée le {new Date(watchlist.created_at).toLocaleDateString('fr-FR')}
            </Typography>
          </Box>

          {!isOwner && (
            <Typography variant="caption" color="text.secondary">
              Par {watchlist.username}
            </Typography>
          )}
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={() => handleViewWatchlist(watchlist.id)}
          >
            Voir les films
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 700 }}>
            <PlaylistAdd sx={{ mr: 1 }} /> Mes Watchlists
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={showPublic ? 'contained' : 'outlined'}
              onClick={() => setShowPublic(!showPublic)}
              startIcon={showPublic ? <VisibilityOff /> : <Visibility />}
            >
              {showPublic ? 'Masquer publiques' : 'Voir publiques'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              }}
            >
              Nouvelle watchlist
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Watchlists de l'utilisateur */}
        <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>
          Mes listes ({watchlists.length})
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {watchlists.map((watchlist) => (
            <Grid item xs={12} sm={6} md={4} key={watchlist.id}>
              <WatchlistCard watchlist={watchlist} isOwner={true} />
            </Grid>
          ))}
        </Grid>

        {watchlists.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucune watchlist créée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Créez votre première watchlist pour organiser vos films !
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateForm(true)}
            >
              Créer ma première watchlist
            </Button>
          </Box>
        )}

        {/* Watchlists publiques */}
        {showPublic && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>
              Watchlists publiques ({publicWatchlists.length})
            </Typography>
            
            <Grid container spacing={3}>
              {publicWatchlists.map((watchlist) => (
                <Grid item xs={12} sm={6} md={4} key={watchlist.id}>
                  <WatchlistCard watchlist={watchlist} isOwner={false} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}

        {/* Menu contextuel */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              const watchlist = watchlists.find(w => w.id === menuWatchlistId);
              if (watchlist) setEditingWatchlist(watchlist);
              handleMenuClose();
            }}
          >
            <Edit sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteConfirm(menuWatchlistId);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        </Menu>

        {/* Formulaire de création */}
        <Dialog open={showCreateForm} onClose={() => setShowCreateForm(false)} maxWidth="sm" fullWidth>
          <WatchlistForm
            onSubmit={handleCreateWatchlist}
            onCancel={() => setShowCreateForm(false)}
            title="Créer une nouvelle watchlist"
          />
        </Dialog>

        {/* Formulaire d'édition */}
        <Dialog open={!!editingWatchlist} onClose={() => setEditingWatchlist(null)} maxWidth="sm" fullWidth>
          <WatchlistForm
            watchlist={editingWatchlist}
            onSubmit={handleEditWatchlist}
            onCancel={() => setEditingWatchlist(null)}
            title="Modifier la watchlist"
          />
        </Dialog>

        {/* Détail de watchlist */}
        <Dialog 
          open={!!selectedWatchlist} 
          onClose={() => setSelectedWatchlist(null)} 
          maxWidth="md" 
          fullWidth
        >
          {selectedWatchlist && (
            <WatchlistDetail
              watchlist={selectedWatchlist}
              onClose={() => setSelectedWatchlist(null)}
              onMovieRemoved={() => {
                handleViewWatchlist(selectedWatchlist.id);
                loadWatchlists();
              }}
            />
          )}
        </Dialog>

        {/* Confirmation de suppression */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer cette watchlist ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button
              onClick={() => deleteConfirm && handleDeleteWatchlist(deleteConfirm)}
              color="error"
              variant="contained"
            >
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>

        {/* FAB pour créer rapidement */}
        <Tooltip title="Nouvelle watchlist">
          <Fab
            color="primary"
            onClick={() => setShowCreateForm(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            <Add />
          </Fab>
        </Tooltip>
      </motion.div>
    </Box>
  );
};

export default WatchlistPanel;