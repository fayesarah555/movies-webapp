import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Movie,
  People,
  DirectionsRun,
  CameraRoll,
  Business,
  Refresh,
  Timeline,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { statsApi, handleApiError, movieApi } from '../api';
import type { DatabaseStats } from '../api';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
// Pour le word cloud
// @ts-ignore
import WordCloud from 'react-d3-cloud';

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const theme = useTheme();

  // Chargement de tous les films (pour stats avancées)
  const loadAllMovies = async () => {
    try {
      const response = await movieApi.getAll(1000, 0); // Limite à 1000 pour la démo
      if (response.status === 'success') {
        setMovies(response.movies);
      } else {
        setMovies([]);
      }
    } catch (err) {
      setMovies([]);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statsApi.getStats();
      
      if (response.status === 'success') {
        setStats(response.stats);
        toast.success('Statistiques chargées avec succès');
      } else {
        const errorMessage = 'Erreur lors du chargement des statistiques';
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
    loadStats();
    loadAllMovies();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
            <BarChart color="primary" />
            Statistiques
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadStats}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Aucune statistique disponible
        </Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Films',
      value: stats.movies_count,
      icon: <Movie />,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
    },
    {
      title: 'Personnes',
      value: stats.persons_count,
      icon: <People />,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
    },
    {
      title: 'Acteurs',
      value: stats.relationships.acted_in,
      icon: <DirectionsRun />,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      title: 'Réalisateurs',
      value: stats.relationships.directed,
      icon: <CameraRoll />,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
    },
    {
      title: 'Producteurs',
      value: stats.relationships.produced,
      icon: <Business />,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
    },
  ];

  const getMoviesByYear = (movies: any[]) => {
    const byYear: Record<string, number> = {};
    movies.forEach(m => {
      if (m.released) {
        byYear[m.released] = (byYear[m.released] || 0) + 1;
      }
    });
    return Object.entries(byYear).map(([year, count]) => ({ year, count }));
  };

  const getMoviesByDecade = (movies: any[]) => {
    const byDecade: Record<string, number> = {};
    movies.forEach(m => {
      if (m.released) {
        const decade = Math.floor(m.released / 10) * 10;
        byDecade[decade] = (byDecade[decade] || 0) + 1;
      }
    });
    return Object.entries(byDecade).map(([decade, count]) => ({ decade, count }));
  };

  const getMoviesByPerson = (movies: any[], field: 'directors' | 'producers' | 'actors') => {
    const byPerson: Record<string, number> = {};
    movies.forEach(m => {
      (m[field] || []).forEach((p: any) => {
        const name = typeof p === 'string' ? p : p.name;
        if (name) byPerson[name] = (byPerson[name] || 0) + 1;
      });
    });
    return Object.entries(byPerson).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  };

  const getMoviesByActor = (movies: any[]) => getMoviesByPerson(movies, 'actors');
  const getMoviesByDirector = (movies: any[]) => getMoviesByPerson(movies, 'directors');
  const getMoviesByProducer = (movies: any[]) => getMoviesByPerson(movies, 'producers');

  const getActorsPerMovie = (movies: any[]) => movies.map(m => (m.actors ? m.actors.length : 0));

  const getImageStats = (movies: any[]) => {
    let withImg = 0, withoutImg = 0;
    movies.forEach(m => {
      if (m.imageUrl && m.imageUrl !== '' && !m.imageUrl.includes('vite.svg')) withImg++;
      else withoutImg++;
    });
    return [
      { name: 'Avec image', value: withImg },
      { name: 'Sans image', value: withoutImg },
    ];
  };

  const getTaglineStats = (movies: any[]) => {
    const freq: Record<string, number> = {};
    movies.forEach(m => {
      if (m.tagline && m.tagline.trim()) {
        freq[m.tagline.trim()] = (freq[m.tagline.trim()] || 0) + 1;
      }
    });
    return Object.entries(freq).map(([text, value]) => ({ text, value })).sort((a, b) => b.value - a.value).slice(0, 30);
  };

  const getTopCollaborations = (movies: any[]) => {
    // Paires d'acteurs ayant joué ensemble
    const pairs: Record<string, number> = {};
    movies.forEach(m => {
      if (m.actors && m.actors.length > 1) {
        for (let i = 0; i < m.actors.length; i++) {
          for (let j = i + 1; j < m.actors.length; j++) {
            const a = m.actors[i].name;
            const b = m.actors[j].name;
            const key = a < b ? `${a} & ${b}` : `${b} & ${a}`;
            pairs[key] = (pairs[key] || 0) + 1;
          }
        }
      }
    });
    return Object.entries(pairs).map(([pair, count]) => ({ pair, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  };

  // Ajout des datasets
  const moviesByYear = getMoviesByYear(movies);
  const moviesByDecade = getMoviesByDecade(movies);
  const moviesByDirector = getMoviesByDirector(movies);
  const moviesByProducer = getMoviesByProducer(movies);
  const moviesByActor = getMoviesByActor(movies);
  const actorsPerMovie = getActorsPerMovie(movies);
  const imageStats = getImageStats(movies);
  const taglineStats = getTaglineStats(movies);
  const topCollaborations = getTopCollaborations(movies);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
          <BarChart color="primary" />
          Statistiques
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadStats}
          disabled={loading}
          sx={{ color: 'primary.main', borderColor: 'primary.main', bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.light', color: 'white' } }}
        >
          {loading ? <CircularProgress size={16} /> : 'Actualiser'}
        </Button>
      </Box>
      {error && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadStats}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      )}
      {!loading && !error && stats && (
        <>
        <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
          {statCards.map((stat) => (
            <Card key={stat.title} sx={{ minWidth: 180, flex: 1, background: stat.bgColor, borderLeft: `6px solid ${stat.color}`, boxShadow: theme.shadows[2], transition: 'all 0.3s', '&:hover': { boxShadow: theme.shadows[8], transform: 'translateY(-4px)' } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2, color: stat.color, display: 'flex', justifyContent: 'center' }}>
                  {React.cloneElement(stat.icon, { sx: { fontSize: 48 } })}
                </Box>
                <Typography variant="h6" component="div" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  sx={{ fontWeight: 'bold', color: stat.color, mb: 1 }}
                >
                  {stat.value.toLocaleString()}
                </Typography>
                <Chip 
                  icon={<TrendingUp />}
                  label="Actif"
                  size="small"
                  sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color, fontWeight: 'bold' }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
        {/* Ajout du graphe */}
        <Box sx={{ mt: 6, height: 350, background: alpha(theme.palette.background.paper, 0.7), borderRadius: 3, boxShadow: theme.shadows[1], p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Statistiques globales (graphe)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ReBarChart data={statCards} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="value" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </Box>
        {/* Histogramme films par année */}
        <Box sx={{ mt: 6, height: 350, background: alpha(theme.palette.background.paper, 0.7), borderRadius: 3, boxShadow: theme.shadows[1], p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Répartition des films par année</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ReBarChart data={moviesByYear} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Bar dataKey="count" fill={theme.palette.info.main} radius={[8, 8, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </Box>
        {/* Word cloud slogans */}
        {/* <Box sx={{ mt: 6, height: 350, background: alpha(theme.palette.background.paper, 0.7), borderRadius: 3, boxShadow: theme.shadows[1], p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Nuage de slogans (taglines)</Typography>
          <WordCloud
            data={taglineStats}
            fontSizeMapper={(word: { value: number }) => Math.log2(word.value + 2) * 15}
            rotate={(_word: { value: number }) => 0}
            width={700}
            height={300}
            padding={2}
          />
        </Box> */}
        </>
      )}
    </Box>
  );
};

export default StatsPanel;
