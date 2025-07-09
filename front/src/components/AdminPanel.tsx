import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Movie as MovieIcon,
  CalendarToday,
  Refresh as RefreshIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { movieApi, handleApiError } from '../api';
import type { Movie } from '../api';
import MovieForm from './MovieForm';

const AdminPanel: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const theme = useTheme();

  const loadMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      try {
        response = await movieApi.getAll(50, 0);
      } catch (err) {
        setLoading(false);
        setError('Erreur réseau ou serveur.');
        toast.error('Erreur réseau ou serveur.');
        return;
      }
      if (response.status === 'success') {
        setMovies(response.movies);
        // Ne pas montrer le toast au chargement initial
        if (movies.length > 0) {
          toast.success(`${response.movies.length} films chargés`);
        }
      } else {
        const errorMessage = response.message || 'Erreur lors du chargement des films';
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

  useEffect(() => {
    loadMovies();
  }, []);

  const handleCreateMovie = () => {
    setEditingMovie(null);
    setShowForm(true);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleSaveMovie = (_movie: Movie) => {
    setShowForm(false);
    setEditingMovie(null);
    loadMovies(); // Recharger la liste
    toast.success(`Film ${editingMovie ? 'modifié' : 'créé'} avec succès`);
  };

  const handleDeleteMovie = async (title: string) => {
    try {
      setDeleteLoading(true);
      setError(null);
      let response;
      try {
        response = await movieApi.delete(title);
      } catch (err) {
        setDeleteLoading(false);
        setError('Erreur réseau ou serveur.');
        toast.error('Erreur réseau ou serveur.');
        return;
      }
      if (response.status === 'success') {
        setMovies(prev => prev.filter(m => m.title !== title));
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
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMovie(null);
  };

  const getUserRole = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.role;
    }
    return 'user';
  };

  const isAdmin = getUserRole() === 'admin';

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`
          }}
        >
          <Typography variant="h4" component="h2" color="error" gutterBottom>
            🚫 Accès refusé
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vous devez être administrateur pour accéder à cette section.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', flexWrap: 'wrap' }}>
            <AdminPanelSettings color="primary" />
            Panel d'administration
            <Chip label={movies.length} color="primary" size="small" sx={{ color: 'white', bgcolor: 'primary.main' }} />
            {loading && <CircularProgress size={20} />}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: { xs: 2, sm: 0 } }}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={loadMovies}
              disabled={loading}
              sx={{ color: 'primary.main', borderColor: 'primary.main', bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateMovie}
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                }
              }}
            >
              Nouveau film
            </Button>
          </Box>
        </Box>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={loadMovies}>
                  Réessayer
                </Button>
              }
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {loading && movies.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TableContainer 
              component={Paper} 
              elevation={2}
              sx={{ 
                borderRadius: 2,
                overflow: 'auto',
                maxWidth: '100%',
                minWidth: 0,
                '& .MuiTableCell-head': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 'bold'
                }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MovieIcon />
                        Titre
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday />
                        Année
                      </Box>
                    </TableCell>
                    <TableCell>Tagline</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movies.map((movie) => (
                    <TableRow
                      key={movie.title}
                      hover
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
                    >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {movie.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={movie.released} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontStyle: 'italic',
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {movie.tagline || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Modifier">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditMovie(movie)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                color="error"
                                onClick={() => setDeleteConfirm(movie.title)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}

        {/* Formulaire de film */}
        <Dialog 
          open={showForm} 
          onClose={handleCancelForm}
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
            onCancel={handleCancelForm}
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
              <DeleteIcon color="error" />
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
            <Button onClick={() => setDeleteConfirm(null)} disabled={deleteLoading}>
              Annuler
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDeleteMovie(deleteConfirm)}
              color="error"
              variant="contained"
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* FAB pour créer un nouveau film */}
        <Tooltip title="Nouveau film">
          <Fab
            color="primary"
            onClick={handleCreateMovie}
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              zIndex: 1200,
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0097A7 90%)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </motion.div>
    </Box>
  );
};

export default AdminPanel;
