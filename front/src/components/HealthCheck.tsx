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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  HealthAndSafety,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Api,
  Storage,
  AccessTime,
  Link,
  Message,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { healthApi, systemApi, handleApiError } from '../api';

const HealthCheck: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [neo4jStatus, setNeo4jStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [neo4jDetails, setNeo4jDetails] = useState<{message?: string; time?: string; uri?: string}>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking');
      const response = await healthApi.check();
      
      if (response.status === 'OK') {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
      setError(handleApiError(err));
    }
  };

  const checkNeo4jHealth = async () => {
    try {
      setNeo4jStatus('checking');
      const response = await systemApi.testNeo4j();
      
      if (response.status === 'success') {
        setNeo4jStatus('online');
        setNeo4jDetails({
          message: response.message,
          time: response.time,
          uri: response.uri
        });
      } else {
        setNeo4jStatus('offline');
        setError(response.message || 'Erreur de connexion Neo4j');
      }
    } catch (err) {
      setNeo4jStatus('offline');
      setError(handleApiError(err));
    }
  };

  const runHealthCheck = async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([checkApiHealth(), checkNeo4jHealth()]);
      toast.success('Vérification des services terminée');
    } catch (err) {
      toast.error('Erreur lors de la vérification des services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'offline': return <Error sx={{ color: theme.palette.error.main }} />;
      case 'checking': return <Warning sx={{ color: theme.palette.warning.main }} />;
      default: return <Warning sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'checking': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'checking': return 'Vérification...';
      default: return 'Inconnu';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <HealthAndSafety color="primary" />
            État des services
          </Typography>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={runHealthCheck}
            disabled={loading}
          >
            {loading ? 'Vérification...' : 'Actualiser'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mb: 3 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Api color="primary" />
                  <Typography variant="h6" component="h3">
                    API FastAPI
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(apiStatus)}
                  <Chip 
                    label={getStatusText(apiStatus)}
                    color={getStatusColor(apiStatus) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Storage color="secondary" />
                  <Typography variant="h6" component="h3">
                    Base de données Neo4j
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(neo4jStatus)}
                  <Chip 
                    label={getStatusText(neo4jStatus)}
                    color={getStatusColor(neo4jStatus) as any}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {neo4jDetails.message && neo4jStatus === 'online' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Typography variant="h6" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage color="success" />
                Détails Neo4j
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Message color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Message"
                    secondary={neo4jDetails.message}
                  />
                </ListItem>
                {neo4jDetails.time && (
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Heure"
                      secondary={neo4jDetails.time}
                    />
                  </ListItem>
                )}
                {neo4jDetails.uri && (
                  <ListItem>
                    <ListItemIcon>
                      <Link color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="URI"
                      secondary={neo4jDetails.uri}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
};

export default HealthCheck;
