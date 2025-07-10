import React, { useState } from 'react';
import { personApi, handleApiError } from '../api';
import type { Movie } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import MovieIcon from '@mui/icons-material/Movie';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';

interface ActorMoviesProps {
  onMovieSelect?: (movie: Movie) => void;
}

const ActorMovies: React.FC<ActorMoviesProps> = ({ onMovieSelect }) => {
  const [loading, setLoading] = useState(false);
  const [actorName, setActorName] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const theme = useTheme();

  const searchActorMovies = async () => {
    if (!actorName.trim()) {
      setError("Veuillez entrer le nom d'un acteur");
      return;
    }
    setLoading(true);
    setError(null);
    setSearchPerformed(false);
    try {
      const response = await personApi.getMoviesByActor(actorName);
      if (response && Array.isArray(response.movies)) {
        setMovies(response.movies);
      } else {
        setMovies([]);
        setError("Aucun film trouvé ou réponse inattendue de l'API.");
      }
      setSearchPerformed(true);
    } catch (err) {
      setError(handleApiError(err));
      setMovies([]);
      setSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchActorMovies();
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.light}11 0%, ${theme.palette.background.paper} 100%)` }}>
        <Typography variant="h4" component="h2" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MovieIcon color="primary" /> Films d'acteur
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Liste des films pour un acteur donné
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Nom de l'acteur"
            variant="outlined"
            value={actorName}
            onChange={e => setActorName(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            autoFocus
          />
          <Button
            variant="contained"
            color="primary"
            onClick={searchActorMovies}
            disabled={loading || !actorName.trim()}
            sx={{ minWidth: 160, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Rechercher'}
          </Button>
        </Box>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          </motion.div>
        )}
        {searchPerformed && movies.length === 0 && !loading && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>Aucun film trouvé pour "{actorName}"</Alert>
          </motion.div>
        )}
        {movies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.dark', fontWeight: 600 }}>
              🎬 Films de {actorName} ({movies.length})
            </Typography>
            <Grid container spacing={2}>
              {movies.map((movie) => (
                <Grid item xs={12} sm={6} md={4} key={movie.title.toString()}>
                  <Card elevation={2} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mb: 1 }}>
                        {movie.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip icon={<MovieIcon />} label={movie.released} size="small" color="primary" variant="outlined" />
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
                        >
                          Voir détails
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
            <CircularProgress size={40} color="primary" />
            <Typography variant="body2" sx={{ mt: 2 }}>Recherche des films...</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ActorMovies;
