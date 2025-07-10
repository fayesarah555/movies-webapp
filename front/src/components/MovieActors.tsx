import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
} from '@mui/material';

const MovieActors: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [actors, setActors] = useState<Array<{name: string; roles: string[]}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchMovieActors = async () => {
    if (!movieTitle.trim()) {
      setError('Veuillez entrer le titre d\'un film');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(false);

    try {
      const response = await movieApi.getActors(movieTitle);
      setActors(response.actors);
      setSearchPerformed(true);
    } catch (err) {
      setError(handleApiError(err));
      setActors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchMovieActors();
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)' }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          Acteurs de film
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Liste des acteurs pour un film donné
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Titre du film"
            variant="outlined"
            value={movieTitle}
            onChange={e => setMovieTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            autoFocus
          />
          <Button
            variant="contained"
            color="primary"
            onClick={searchMovieActors}
            disabled={loading || !movieTitle.trim()}
            sx={{ minWidth: 160, fontWeight: 600 }}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {searchPerformed && actors.length === 0 && !loading && !error && (
          <Alert severity="info" sx={{ mb: 2 }}>Aucun acteur trouvé pour "{movieTitle}"</Alert>
        )}
        {actors.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              {actors.map((actor, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'primary.main' }}>{actor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rôles : {actor.roles.join(', ')}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MovieActors;
