import React, { useState } from 'react';
import { movieApi, handleApiError } from '../api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import MovieIcon from '@mui/icons-material/Movie';
import StarIcon from '@mui/icons-material/Star';
import RecommendationQuiz from './RecommendationQuiz';

interface RecommendationSearchProps {
  className?: string;
}

const RecommendationSearch: React.FC<RecommendationSearchProps> = ({ className = '' }) => {
  const [searchTitle, setSearchTitle] = useState('');
  const [searchType, setSearchType] = useState<'movie' | 'quiz'>('movie');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseTitle, setBaseTitle] = useState('');
  const theme = useTheme();

  const searchRecommendations = async () => {
    if (searchType === 'movie' && !searchTitle.trim()) {
      setError('Veuillez entrer un titre de film');
      return;
    }
    setLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const response = await movieApi.getRecommendations(searchTitle.trim(), 10);
      if (response.status === 'success') {
        setRecommendations(response.recommendations);
        setBaseTitle(response.base_title);
      } else {
        setError('Aucune recommandation trouvée pour ce film');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchRecommendations();
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.light}11 0%, ${theme.palette.background.paper} 100%)` }}>
        <Typography variant="h4" component="h2" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MovieIcon color="primary" /> Recherche de recommandations
        </Typography>
        
        <RadioGroup
          row
          value={searchType}
          onChange={e => setSearchType(e.target.value as 'movie' | 'quiz')}
          sx={{ mb: 3 }}
        >
          <FormControlLabel value="movie" control={<Radio color="primary" />} label="Films similaires" />
          <FormControlLabel value="quiz" control={<Radio color="primary" />} label="Quiz personnalisé" />
        </RadioGroup>

        {searchType === 'quiz' ? (
          <RecommendationQuiz />
        ) : (
          <>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              Trouvez des films similaires à un film que vous aimez
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Titre du film de référence"
                variant="outlined"
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                autoFocus
              />
              <Button
                variant="contained"
                color="primary"
                onClick={searchRecommendations}
                disabled={loading}
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Recommander'}
              </Button>
            </Box>
            
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              </motion.div>
            )}
            
            {recommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.dark', fontWeight: 600 }}>
                  🎯 Films similaires à "{baseTitle}"
                </Typography>
                <Grid container spacing={2}>
                  {recommendations.map((rec, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card elevation={2} sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                        <CardContent>
                          {rec.imageUrl && (
                            <Box sx={{ width: '100%', height: 180, overflow: 'hidden', borderRadius: 2, mb: 1, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={rec.imageUrl}
                                alt={rec.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                                loading="lazy"
                              />
                            </Box>
                          )}
                          <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mb: 1 }}>
                            {rec.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip icon={<MovieIcon />} label={rec.released} size="small" color="primary" variant="outlined" />
                            {rec.score && (
                              <Chip icon={<StarIcon sx={{ color: '#FFD700' }} />} label={`Score: ${rec.score.toFixed(2)}`} size="small" color="secondary" />
                            )}
                          </Box>
                          {rec.tagline && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              "{rec.tagline}"
                            </Typography>
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
                <Typography variant="body2" sx={{ mt: 2 }}>Recherche de recommandations...</Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RecommendationSearch;