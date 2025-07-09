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
import { statsApi, handleApiError } from '../api';
import type { DatabaseStats } from '../api';

const StatsPanel: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

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
        <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
          {statCards.map((stat, index) => (
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
      )}
    </Box>
  );
};

export default StatsPanel;
