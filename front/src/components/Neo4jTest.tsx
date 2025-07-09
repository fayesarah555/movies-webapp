import React, { useState } from 'react';
import { api, handleApiError } from '../api';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

const Neo4jTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testNeo4j = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.get('/neo4j/test');
      setResult(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: { xs: 1, sm: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #fff 100%)' }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          Test Neo4j
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
          Test de la connexion à la base Neo4j
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={testNeo4j}
            disabled={loading}
            sx={{ fontWeight: 600 }}
          >
            {loading ? 'Test en cours...' : 'Tester Neo4j'}
          </Button>
        </Box>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.dark', mb: 1 }}>
              ✅ Résultat du test
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 15 }}>{JSON.stringify(result, null, 2)}</pre>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Neo4jTest;
