import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, Save, Add } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { watchlistApi, handleApiError } from '../api';
import type { Watchlist, WatchlistCreate } from '../api';

interface WatchlistFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (watchlist: Watchlist) => void;
  watchlist?: Watchlist | null;
  mode: 'create' | 'edit';
}

const WatchlistForm: React.FC<WatchlistFormProps> = ({
  open,
  onClose,
  onSuccess,
  watchlist,
  mode
}) => {
  const [formData, setFormData] = useState<WatchlistCreate>({
    name: watchlist?.name || '',
    description: watchlist?.description || '',
    is_public: watchlist?.is_public || false,
    category: watchlist?.category || 'general'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'general', label: '📋 Général' },
    { value: 'favorites', label: '❤️ Favoris' },
    { value: 'to_watch', label: '👀 À regarder' },
    { value: 'watched', label: '✅ Vus' },
    { value: 'recommendations', label: '⭐ Recommandations' },
    { value: 'classics', label: '🏛️ Classiques' },
    { value: 'action', label: '💥 Action' },
    { value: 'comedy', label: '😂 Comédie' },
    { value: 'drama', label: '🎭 Drame' },
    { value: 'horror', label: '😱 Horreur' },
    { value: 'sci_fi', label: '🚀 Science-fiction' },
    { value: 'romance', label: '💕 Romance' },
    { value: 'thriller', label: '🕵️ Thriller' },
    { value: 'documentary', label: '📹 Documentaire' },
    { value: 'animation', label: '🎨 Animation' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Famille' },
    { value: 'music', label: '🎵 Musical' },
    { value: 'war', label: '⚔️ Guerre' },
    { value: 'western', label: '🤠 Western' },
    { value: 'crime', label: '🔫 Crime' },
    { value: 'mystery', label: '🔍 Mystère' },
    { value: 'fantasy', label: '🧙 Fantasy' },
    { value: 'adventure', label: '🗺️ Aventure' },
    { value: 'biography', label: '📚 Biographie' },
    { value: 'history', label: '🏺 Histoire' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Le nom de la watchlist est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let result: Watchlist;
      
      if (mode === 'create') {
        result = await watchlistApi.create(formData);
        toast.success(`Watchlist "${formData.name}" créée avec succès !`);
      } else {
        if (!watchlist?.id) {
          throw new Error('ID de watchlist manquant pour la modification');
        }
        result = await watchlistApi.update(watchlist.id, formData);
        toast.success(`Watchlist "${formData.name}" modifiée avec succès !`);
      }
      
      onSuccess(result);
      onClose();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WatchlistCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(37, 37, 69, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {mode === 'create' ? <Add /> : <Save />}
            {mode === 'create' ? 'Nouvelle Watchlist' : 'Modifier la Watchlist'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Nom de la watchlist */}
              <TextField
                label="Nom de la watchlist"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                fullWidth
                required
                disabled={loading}
                placeholder="Ma super watchlist..."
                InputProps={{
                  sx: {
                    backgroundColor: 'rgba(37, 37, 69, 0.5)',
                    borderRadius: 2,
                  }
                }}
              />

              {/* Description */}
              <TextField
                label="Description (optionnel)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                multiline
                rows={3}
                disabled={loading}
                placeholder="Description de votre watchlist..."
                InputProps={{
                  sx: {
                    backgroundColor: 'rgba(37, 37, 69, 0.5)',
                    borderRadius: 2,
                  }
                }}
              />

              {/* Catégorie */}
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Catégorie"
                  disabled={loading}
                  sx={{
                    backgroundColor: 'rgba(37, 37, 69, 0.5)',
                    borderRadius: 2,
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Visibilité publique */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">
                      {formData.is_public ? '🌍 Watchlist publique' : '🔒 Watchlist privée'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.is_public 
                        ? 'Visible par tous les utilisateurs' 
                        : 'Visible uniquement par vous'
                      }
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start' }}
              />

              {/* Aperçu de la catégorie */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📋 Aperçu
                </Typography>
                <Typography variant="h6" sx={{ color: 'primary.main' }}>
                  {categories.find(cat => cat.value === formData.category)?.label || '📋 Général'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formData.name || 'Nom de votre watchlist'}
                  {formData.is_public ? ' • Public' : ' • Privé'}
                </Typography>
              </Box>

              {/* Erreur */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error">
                    {error}
                  </Alert>
                </motion.div>
              )}
            </Box>
          </motion.div>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : (mode === 'create' ? <Add /> : <Save />)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }
            }}
          >
            {loading 
              ? (mode === 'create' ? 'Création...' : 'Modification...') 
              : (mode === 'create' ? 'Créer' : 'Modifier')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WatchlistForm;