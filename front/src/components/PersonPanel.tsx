import React, { useState, useEffect } from 'react';
import { personApi, handleApiError } from '../api';
import { PermissionGate } from '../auth';
import type { Person } from '../api';
import { Box, useTheme } from '@mui/material';

// Fonction utilitaire pour extraire le titre d'un film
const getMovieTitle = (movie: any): string => {
  if (typeof movie === 'string') {
    return movie;
  }
  if (movie && typeof movie === 'object') {
    return movie.movie || movie.title || movie.name || '[Titre inconnu]';
  }
  return '[Titre invalide]';
};

const PersonPanel: React.FC = () => {
  const theme = useTheme();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [newPerson, setNewPerson] = useState({ name: '', born: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await personApi.getAll(50, 0);
      
      if (response.status === 'success') {
        setPersons(response.persons);
      } else {
        setError('Erreur lors du chargement des acteurs');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, []);

  const handlePersonClick = async (person: Person) => {
    try {
      setError(null);
      const response = await personApi.getByName(person.name);
      
      if (response.status === 'success') {
        setSelectedPerson(response);
      } else {
        setError('Erreur lors du chargement des détails');
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPerson.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const personData = {
        name: newPerson.name.trim(),
        ...(newPerson.born && { born: parseInt(newPerson.born) })
      };
      
      const response = await personApi.create(personData);
      
      if (response.status === 'success') {
        setNewPerson({ name: '', born: '' });
        setShowForm(false);
        loadPersons();
      } else {
        setError(response.message || 'Erreur lors de la création');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPerson = (person: any) => {
    setEditingPerson(person);
    setNewPerson({ 
      name: person.name, 
      born: person.born ? String(person.born) : '' 
    });
    setShowForm(true);
  };

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPerson.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!editingPerson) {
      setError('Aucune personne sélectionnée pour la modification');
      return;
    }

    const personData = {
      name: newPerson.name.trim(),
      born: newPerson.born ? parseInt(newPerson.born) : undefined
    };

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await personApi.update(editingPerson.name, personData);
      
      if (response.status === 'success') {
        setNewPerson({ name: '', born: '' });
        setEditingPerson(null);
        setShowForm(false);
        loadPersons();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPerson(null);
    setNewPerson({ name: '', born: '' });
    setShowForm(false);
  };

  const handleDeletePerson = async (name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      return;
    }

    try {
      setError(null);
      const response = await personApi.delete(name);
      
      if (response.status === 'success') {
        loadPersons();
        setSelectedPerson(null);
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const getMoviesByActor = async (name: string) => {
    try {
      setError(null);
      const response = await personApi.getMoviesByActor(name);
      
      if (response.status === 'success') {
        return response.movies;
      }
      return [];
    } catch (err) {
      setError(handleApiError(err));
      return [];
    }
  };

  return (
    <Box className="person-panel" sx={{
      background: theme.palette.background.paper,
      color: theme.palette.text.primary + ' !important',
      borderRadius: 3,
      p: 3,
      mb: 3,
      boxShadow: 2,
      '& *': {
        color: theme.palette.text.primary + ' !important',
      },
    }}>
      <Box className="person-header" sx={{
        background: theme.palette.background.default,
        color: theme.palette.text.primary + ' !important',
        borderRadius: 2,
        p: 2,
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{margin: 0}}>🎭 Gestion des acteurs</h2>
        <PermissionGate permission="admin">
          <button 
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            ➕ Ajouter un acteur
          </button>
        </PermissionGate>
      </Box>

      {showForm && (
        <Box className="person-form" sx={{
          background: theme.palette.background.default,
          color: theme.palette.text.primary,
          borderRadius: 2,
          p: 2,
          mb: 2,
          boxShadow: 1,
        }}>
          <h3>{editingPerson ? 'Modifier acteur' : 'Nouvel acteur'}</h3>
          <form onSubmit={editingPerson ? handleUpdatePerson : handleCreatePerson}>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={newPerson.name}
                onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom complet"
                disabled={submitting}
              />
            </div>
            
            <div className="form-group">
              <label>Année de naissance</label>
              <input
                type="number"
                value={newPerson.born}
                onChange={(e) => setNewPerson(prev => ({ ...prev, born: e.target.value }))}
                placeholder="Année de naissance (optionnel)"
                min="1900"
                max={new Date().getFullYear()}
                disabled={submitting}
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingPerson ? 'Mettre à jour' : 'Créer'}
              </button>
              <button 
                type="button" 
                onClick={editingPerson ? handleCancelEdit : () => setShowForm(false)}
                disabled={submitting}
              >
                {editingPerson ? 'Annuler' : 'Fermer'}
              </button>
            </div>
          </form>
        </Box>
      )}

      {error && !showForm && (
        <div className="error">
          {error}
          <button onClick={loadPersons} className="btn-secondary">
            Réessayer
          </button>
        </div>
      )}

      <Box className="person-content" sx={{
        display: 'flex',
        gap: 3,
        mt: 2,
        color: theme.palette.text.primary + ' !important',
      }}>
        <Box className="person-list" sx={{
          flex: 1,
          background: theme.palette.background.default,
          color: theme.palette.text.primary + ' !important',
          borderRadius: 2,
          p: 2,
          boxShadow: 1,
        }}>
          <h3>Liste des acteurs ({persons.length})</h3>
          
          {loading && <div className="loading">Chargement...</div>}
          
          {!loading && persons.length === 0 && (
            <div className="no-persons">
              <p>Aucun acteur trouvé</p>
            </div>
          )}
          
          <div className="persons-grid">
            {persons.map((person) => (
              <div 
                key={person.name} 
                className={`person-card ${selectedPerson?.name === person.name ? 'selected' : ''}`}
                onClick={() => handlePersonClick(person)}
              >
                <h4>{person.name}</h4>
                {person.born && <p>Né(e) en {person.born}</p>}
                
                <PermissionGate permission="admin">
                  <div className="person-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPerson(person);
                      }}
                      className="btn-secondary btn-small"
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePerson(person.name);
                      }}
                      className="btn-danger btn-small"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </PermissionGate>
              </div>
            ))}
          </div>
        </Box>
        
        {selectedPerson && (
          <Box className="person-details" sx={{
            flex: 1.2,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary + ' !important',
            borderRadius: 2,
            p: 3,
            boxShadow: 2,
            ml: 2,
            minWidth: 320,
            '& *': {
              color: theme.palette.text.primary + ' !important',
            },
          }}>
            <h3>Détails de {selectedPerson.name}</h3>
            
            <div className="person-info">
              {selectedPerson.born && (
                <p><strong>Né(e) en :</strong> {selectedPerson.born}</p>
              )}
              
              {selectedPerson.acted_in.length > 0 && (
                <div className="filmography">
                  <h4>🎭 Films en tant qu'acteur ({selectedPerson.acted_in.length})</h4>
                  <ul>
                    {selectedPerson.acted_in.map((movie: any, index: number) => (
                      <li key={index}>
                        {getMovieTitle(movie)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedPerson.directed.length > 0 && (
                <div className="filmography">
                  <h4>🎬 Films en tant que réalisateur ({selectedPerson.directed.length})</h4>
                  <ul>
                    {selectedPerson.directed.map((movie: any, index: number) => (
                      <li key={index}>
                        {getMovieTitle(movie)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedPerson.produced.length > 0 && (
                <div className="filmography">
                  <h4>🎪 Films en tant que producteur ({selectedPerson.produced.length})</h4>
                  <ul>
                    {selectedPerson.produced.map((movie: any, index: number) => (
                      <li key={index}>
                        {getMovieTitle(movie)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedPerson(null)}
              className="btn-secondary"
            >
              Fermer
            </button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PersonPanel;
