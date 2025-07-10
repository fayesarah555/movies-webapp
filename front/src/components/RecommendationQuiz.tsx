import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  FormControl,
  FormLabel,
  Checkbox,
  FormGroup,
  Slider,
  Autocomplete,
  TextField,
} from '@mui/material';
import { motion } from 'framer-motion';
import MovieIcon from '@mui/icons-material/Movie';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import { movieApi, personApi, handleApiError } from '../api';

interface QuizPreferences {
  preferredActors: string[];
  preferredDirectors: string[];
  yearRange: [number, number];
  likedMovies: string[];
  preferredDecades: string[];
  movieMood: string;
}

const RecommendationQuiz: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<QuizPreferences>({
    preferredActors: [],
    preferredDirectors: [],
    yearRange: [1990, 2023],
    likedMovies: [],
    preferredDecades: [],
    movieMood: '',
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableActors, setAvailableActors] = useState<string[]>([]);
  const [availableDirectors, setAvailableDirectors] = useState<string[]>([]);
  const [availableMovies, setAvailableMovies] = useState<string[]>([]);
  const theme = useTheme();

  // Charger les données disponibles
  React.useEffect(() => {
    loadAvailableOptions();
  }, []);

  const loadAvailableOptions = async () => {
    try {
      // Charger les films
      const moviesResponse = await movieApi.getAll(50, 0);
      if (moviesResponse.status === 'success') {
        setAvailableMovies(moviesResponse.movies.map(m => m.title));
      }

      // Charger les personnes
      const personsResponse = await personApi.getAll(30, 0);
      if (personsResponse.status === 'success') {
        const actors: string[] = [];
        const directors: string[] = [];
        
        // Séparer acteurs et réalisateurs
        for (const person of personsResponse.persons.slice(0, 15)) {
          try {
            const personDetails = await personApi.getByName(person.name);
            if (personDetails.status === 'success') {
              if (personDetails.acted_in.length > 0) {
                actors.push(person.name);
              }
              if (personDetails.directed.length > 0) {
                directors.push(person.name);
              }
            }
          } catch (e) {
            // Continue en cas d'erreur
          }
        }
        
        setAvailableActors([...new Set(actors)]);
        setAvailableDirectors([...new Set(directors)]);
      }
    } catch (err) {
      console.error('Erreur chargement options:', err);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allRecommendations = [];
      
      // Recommandations basées sur les acteurs
      for (const actor of preferences.preferredActors.slice(0, 2)) {
        try {
          const actorMovies = await personApi.getMoviesByActor(actor);
          if (actorMovies.status === 'success') {
            allRecommendations.push(...actorMovies.movies.map(m => ({
              ...m,
              reason: `Avec ${actor}`,
              score: 0.8
            })));
          }
        } catch (e) {
          console.error(`Erreur acteur ${actor}:`, e);
        }
      }

      // Recommandations basées sur les films aimés
      for (const movie of preferences.likedMovies.slice(0, 2)) {
        try {
          const similarMovies = await movieApi.getRecommendations(movie, 3);
          if (similarMovies.status === 'success') {
            allRecommendations.push(...similarMovies.recommendations.map(m => ({
              ...m,
              reason: `Similaire à "${movie}"`,
              score: 0.9
            })));
          }
        } catch (e) {
          console.error(`Erreur film ${movie}:`, e);
        }
      }

      // Filtrer par période
      let filteredRecommendations = allRecommendations.filter(movie => 
        movie.released >= preferences.yearRange[0] && 
        movie.released <= preferences.yearRange[1]
      );

      // Filtrer par décennie si spécifié
      if (preferences.preferredDecades.length > 0) {
        filteredRecommendations = filteredRecommendations.filter(movie => {
          const decade = Math.floor(movie.released / 10) * 10;
          return preferences.preferredDecades.includes(decade.toString());
        });
      }

      // Supprimer les doublons et trier
      const uniqueRecommendations = filteredRecommendations
        .filter((movie, index, self) => 
          index === self.findIndex(m => m.title === movie.title)
        )
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 12);

      setRecommendations(uniqueRecommendations);
      
      if (uniqueRecommendations.length === 0) {
        setError('Aucune recommandation trouvée. Essayez d\'élargir vos critères.');
      }
      
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setPreferences({
      preferredActors: [],
      preferredDirectors: [],
      yearRange: [1990, 2023],
      likedMovies: [],
      preferredDecades: [],
      movieMood: '',
    });
    setRecommendations([]);
    setError(null);
  };

  const steps = [
    {
      title: "🎭 Acteurs préférés",
      subtitle: "Quels sont vos acteurs favoris ?",
      content: (
        <Autocomplete
          multiple
          options={availableActors}
          value={preferences.preferredActors}
          onChange={(_, newValue) => 
            setPreferences(prev => ({ ...prev, preferredActors: newValue }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionnez vos acteurs préférés"
              placeholder="Tapez pour rechercher..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
        />
      )
    },
    {
      title: "🎬 Réalisateurs préférés",
      subtitle: "Y a-t-il des réalisateurs que vous appréciez ?",
      content: (
        <Autocomplete
          multiple
          options={availableDirectors}
          value={preferences.preferredDirectors}
          onChange={(_, newValue) => 
            setPreferences(prev => ({ ...prev, preferredDirectors: newValue }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Sélectionnez vos réalisateurs préférés"
              placeholder="Tapez pour rechercher..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
        />
      )
    },
    {
      title: "🎞️ Films que vous avez aimés",
      subtitle: "Quels films avez-vous particulièrement appréciés ?",
      content: (
        <Autocomplete
          multiple
          options={availableMovies}
          value={preferences.likedMovies}
          onChange={(_, newValue) => 
            setPreferences(prev => ({ ...prev, likedMovies: newValue }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Films que vous avez aimés"
              placeholder="Tapez pour rechercher..."
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
        />
      )
    },
    {
      title: "📅 Période préférée",
      subtitle: "Dans quelle période chercher des films ?",
      content: (
        <Box>
          <Typography gutterBottom>
            Années : {preferences.yearRange[0]} - {preferences.yearRange[1]}
          </Typography>
          <Slider
            value={preferences.yearRange}
            onChange={(_, newValue) => 
              setPreferences(prev => ({ ...prev, yearRange: newValue as [number, number] }))
            }
            valueLabelDisplay="auto"
            min={1970}
            max={2024}
            sx={{ mt: 2, mb: 4 }}
          />
          
          <Typography variant="h6" gutterBottom>
            Décennies favorites (optionnel) :
          </Typography>
          <FormGroup>
            {['1970', '1980', '1990', '2000', '2010', '2020'].map((decade) => (
              <FormControlLabel
                key={decade}
                control={
                  <Checkbox
                    checked={preferences.preferredDecades.includes(decade)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPreferences(prev => ({
                          ...prev,
                          preferredDecades: [...prev.preferredDecades, decade]
                        }));
                      } else {
                        setPreferences(prev => ({
                          ...prev,
                          preferredDecades: prev.preferredDecades.filter(d => d !== decade)
                        }));
                      }
                    }}
                  />
                }
                label={`Années ${decade}s`}
              />
            ))}
          </FormGroup>
        </Box>
      )
    },
    {
      title: "🎯 Type de film",
      subtitle: "Quel genre d'ambiance recherchez-vous ?",
      content: (
        <FormControl component="fieldset">
          <FormLabel component="legend">Choisissez l'ambiance :</FormLabel>
          <RadioGroup
            value={preferences.movieMood}
            onChange={(e) => 
              setPreferences(prev => ({ ...prev, movieMood: e.target.value }))
            }
          >
            <FormControlLabel value="action" control={<Radio />} label="🚀 Action et adrénaline" />
            <FormControlLabel value="drama" control={<Radio />} label="🎭 Drame et émotions" />
            <FormControlLabel value="comedy" control={<Radio />} label="😄 Comédie et détente" />
            <FormControlLabel value="thriller" control={<Radio />} label="🕵️ Suspense et mystère" />
            <FormControlLabel value="classic" control={<Radio />} label="🏛️ Classiques intemporels" />
            <FormControlLabel value="any" control={<Radio />} label="🎲 Peu importe !" />
          </RadioGroup>
        </FormControl>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  if (recommendations.length > 0) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" /> Vos recommandations personnalisées
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          {recommendations.length} films sélectionnés selon vos préférences
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {recommendations.map((rec, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mb: 1 }}>
                    {rec.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip icon={<MovieIcon />} label={rec.released} size="small" color="primary" variant="outlined" />
                    {rec.score && (
                      <Chip 
                        icon={<StarIcon sx={{ color: '#FFD700' }} />} 
                        label={`${Math.round(rec.score * 100)}%`} 
                        size="small" 
                        color="secondary" 
                      />
                    )}
                  </Box>
                  {rec.reason && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      {rec.reason}
                    </Typography>
                  )}
                  {rec.tagline && (
                    <Typography variant="body2" color="text.secondary">
                      "{rec.tagline}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={resetQuiz}>
            Refaire le quiz
          </Button>
          <Button
            variant="contained"
            onClick={generateRecommendations}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Nouvelles recommandations'}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" /> Quiz de recommandations
      </Typography>
      
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        Répondez à quelques questions pour des recommandations sur mesure
      </Typography>

      {/* Barre de progression */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Étape {currentStep + 1} sur {steps.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </Typography>
        </Box>
        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
          <Box
            sx={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              bgcolor: 'primary.main',
              height: 8,
              borderRadius: 1,
              transition: 'width 0.3s ease'
            }}
          />
        </Box>
      </Box>

      {/* Étape actuelle */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Typography variant="h6" sx={{ mb: 1, color: 'primary.dark', fontWeight: 600 }}>
          {currentStepData.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          {currentStepData.subtitle}
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {currentStepData.content}
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Boutons de navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Précédent
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            currentStep === steps.length - 1 ? 'Obtenir mes recommandations' : 'Suivant'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default RecommendationQuiz;