import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
} from '@mui/material';
import {
  BugReport,
  PlayArrow,
  CheckCircle,
  Error,
  ExpandMore,
  Code,
  Api,
  Storage,
  Search,
  Movie,
  Recommend,
  HealthAndSafety,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { movieApi, healthApi, systemApi, handleApiError } from '../api';

const ApiTester: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const theme = useTheme();

  const testEndpoint = async (name: string, testFunction: () => Promise<any>) => {
    try {
      setLoading(true);
      setActiveTest(name);
      setError(null);
      setResults(null);
      
      console.log(`🧪 Testing ${name}...`);
      const result = await testFunction();
      console.log(`✅ ${name} Success:`, result);
      setResults({ name, result });
      toast.success(`Test "${name}" réussi !`);
    } catch (err) {
      console.error(`❌ ${name} Error:`, err);
      const errorMessage = `${name}: ${handleApiError(err)}`;
      setError(errorMessage);
      toast.error(`Test "${name}" échoué`);
    } finally {
      setLoading(false);
      setActiveTest(null);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      description: 'Vérifier l\'état de l\'API',
      test: () => healthApi.check(),
      icon: <HealthAndSafety />,
      color: theme.palette.success.main
    },
    {
      name: 'Neo4j Test',
      description: 'Tester la connexion Neo4j',
      test: () => systemApi.testNeo4j(),
      icon: <Storage />,
      color: theme.palette.info.main
    },
    {
      name: 'Get Movies',
      description: 'Récupérer la liste des films',
      test: () => movieApi.getAll(5, 0),
      icon: <Movie />,
      color: theme.palette.primary.main
    },
    {
      name: 'Search Movies',
      description: 'Rechercher des films',
      test: () => movieApi.search('Matrix'),
      icon: <Search />,
      color: theme.palette.secondary.main
    },
    {
      name: 'Get Movie Details',
      description: 'Détails d\'un film spécifique',
      test: () => movieApi.getByTitle('The Matrix'),
      icon: <Api />,
      color: theme.palette.warning.main
    },
    {
      name: 'Get Recommendations',
      description: 'Recommandations pour un film',
      test: () => movieApi.getRecommendations('The Matrix'),
      icon: <Recommend />,
      color: theme.palette.error.main
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BugReport color="primary" />
          <Typography variant="h4" component="h1" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            Testeur API
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Testez les différents endpoints de l'API pour vérifier leur fonctionnement
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: 3,
          mb: 4
        }}>
          {tests.map((test, index) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  border: `1px solid ${alpha(test.color, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {React.cloneElement(test.icon, { sx: { color: test.color } })}
                    <Typography variant="h6" component="h3">
                      {test.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {test.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={
                      loading && activeTest === test.name ? (
                        <CircularProgress size={16} />
                      ) : (
                        <PlayArrow />
                      )
                    }
                    onClick={() => testEndpoint(test.name, test.test)}
                    disabled={loading}
                    sx={{
                      bgcolor: test.color,
                      '&:hover': {
                        bgcolor: alpha(test.color, 0.8),
                      }
                    }}
                  >
                    {loading && activeTest === test.name ? 'Test en cours...' : 'Tester'}
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          ))}
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
              icon={<Error />}
            >
              <Typography variant="h6" component="div">
                Erreur de test
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          </motion.div>
        )}
        
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" component="h3">
                  Résultats - {results.name}
                </Typography>
                <Chip label="Succès" color="success" size="small" />
              </Box>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Code />
                    <Typography variant="body1">
                      Voir les données JSON
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.grey[50],
                      maxHeight: 400,
                      overflow: 'auto'
                    }}
                  >
                    <Typography 
                      component="pre" 
                      sx={{ 
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {JSON.stringify(results.result, null, 2)}
                    </Typography>
                  </Paper>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </motion.div>
        )}
      </motion.div>
    </Box>
  );
};

export default ApiTester;
