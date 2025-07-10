// Point central pour les appels à l'API FastAPI
import axios from 'axios';

// À personnaliser selon l'environnement
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Timeout de 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajout automatique du token JWT si présent
type TokenGetter = () => string | null;
let getToken: TokenGetter = () => localStorage.getItem('token');
export const setTokenGetter = (fn: TokenGetter) => { getToken = fn; };

// Ajout d'un intercepteur pour logger les requêtes (utile pour le debug)
api.interceptors.request.use((config) => {
  console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour la gestion des erreurs
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types TypeScript pour l'API
export interface Movie {
  title: string;
  released: number;
  tagline: string;
  imageUrl?: string;
  actors?: Array<{name: string; roles: string[]}>;
  directors?: string[];
  producers?: string[];
}

export interface Person {
  name: string;
  born?: number;
  movies?: string[];
}

export interface PersonDetails {
  name: string;
  born?: number;
  acted_in: (string | {movie: string; roles?: string[]})[];
  directed: (string | {movie: string})[];
  produced: (string | {movie: string})[];
}

export interface Review {
  username: string;
  movie_title: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ReviewInput {
  movie_title: string;
  rating: number;
  comment?: string;
}

export interface Collaboration {
  person1: string;
  person2: string;
  collaborations: number;
  movies: string[];
  similarity1?: number;
  similarity2?: number;
}

export interface DatabaseStats {
  movies_count: number;
  persons_count: number;
  relationships: {
    acted_in: number;
    directed: number;
    produced: number;
  };
  latest_movie?: {
    title: string;
    released: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface MoviesResponse {
  status: 'success' | 'error';
  movies: Movie[];
  count: number;
  message?: string;
}

export interface User {
  username: string;
  email?: string;
  is_admin?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  role?: string;
}

// Fonctions API
export const movieApi = {
  // Récupérer tous les films avec pagination
  getAll: async (limit: number = 20, skip: number = 0): Promise<MoviesResponse> => {
    const response = await api.get(`/movies?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  // Récupérer un film par titre
  getByTitle: async (title: string): Promise<Movie & {status: string; message?: string}> => {
    const response = await api.get(`/movies/${encodeURIComponent(title)}`);
    return response.data;
  },

  // Créer un nouveau film
  create: async (movieData: Partial<Movie>): Promise<ApiResponse<Movie>> => {
    const response = await api.post('/movies', movieData);
    return response.data;
  },

  // Mettre à jour un film
  update: async (title: string, movieData: Partial<Movie>): Promise<ApiResponse<Movie>> => {
    const response = await api.put(`/movies/${encodeURIComponent(title)}`, movieData);
    return response.data;
  },

  // Supprimer un film
  delete: async (title: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/movies/${encodeURIComponent(title)}`);
    return response.data;
  },

  // Rechercher des films
  search: async (query: string): Promise<MoviesResponse> => {
    const response = await api.get(`/search/movies?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Obtenir des recommandations similaires
  getRecommendations: async (title: string, limit: number = 5): Promise<{status: string; recommendations: Movie[]; base_title: string}> => {
    const response = await api.get(`/recommend/movies/similar/${encodeURIComponent(title)}?limit=${limit}`);
    return response.data;
  },

  // Obtenir des recommandations pour un utilisateur
  getUserRecommendations: async (username: string, limit: number = 5): Promise<{status: string; recommendations: Movie[]; user: string}> => {
    const response = await api.get(`/recommend/movies/${encodeURIComponent(username)}?limit=${limit}`);
    return response.data;
  },

  // Obtenir les acteurs d'un film
  getActors: async (title: string): Promise<{status: string; movie: string; actors: Array<{name: string; roles: string[]}>; count: number}> => {
    const response = await api.get(`/movies/${encodeURIComponent(title)}/actors`);
    return response.data;
  },

  // Ajouter un acteur à un film
  addActor: async (movieTitle: string, actorData: {name: string; roles: string[]}): Promise<ApiResponse<void>> => {
    const response = await api.post(`/movies/${encodeURIComponent(movieTitle)}/actors`, actorData);
    return response.data;
  }
};

export const personApi = {
  // Récupérer toutes les personnes
  getAll: async (limit: number = 20, skip: number = 0): Promise<{status: string; persons: Person[]; count: number}> => {
    const response = await api.get(`/persons?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  // Récupérer une personne par nom
  getByName: async (name: string): Promise<{status: string} & PersonDetails> => {
    const response = await api.get(`/persons/${encodeURIComponent(name)}`);
    return response.data;
  },

  // Créer une nouvelle personne
  create: async (personData: {name: string; born?: number}): Promise<ApiResponse<Person>> => {
    const response = await api.post('/persons', personData);
    return response.data;
  },

  // Mettre à jour une personne
  update: async (name: string, personData: Partial<Person>): Promise<ApiResponse<Person>> => {
    const response = await api.put(`/persons/${encodeURIComponent(name)}`, personData);
    return response.data;
  },

  // Supprimer une personne
  delete: async (name: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/persons/${encodeURIComponent(name)}`);
    return response.data;
  },

  // Obtenir les films d'un acteur
  getMoviesByActor: async (name: string): Promise<{status: string; actor: string; movies: Movie[]; count: number}> => {
    const response = await api.get(`/persons/actors/${encodeURIComponent(name)}/movies`);
    return response.data;
  }
};

export const collaborationApi = {
  // Obtenir les collaborations entre deux personnes
  getCollaborations: async (person1: string, person2: string): Promise<Collaboration> => {
    const response = await api.get(`/collaborations?person1=${encodeURIComponent(person1)}&person2=${encodeURIComponent(person2)}`);
    return response.data;
  }
};

export const reviewApi = {
  // Ajouter un avis
  add: async (reviewData: ReviewInput): Promise<Review> => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  // Obtenir les avis d'un film
  getByMovie: async (movieTitle: string): Promise<{reviews: Review[]; count: number}> => {
    const response = await api.get(`/reviews/${encodeURIComponent(movieTitle)}`);
    return response.data;
  }
};

export const statsApi = {
  // Obtenir les statistiques de la base de données
  getStats: async (): Promise<{status: string; stats: DatabaseStats}> => {
    const response = await api.get('/stats');
    return response.data;
  }
};

export const systemApi = {
  // Test de la route racine
  getRoot: async (): Promise<any> => {
    const response = await api.get('/');
    return response.data;
  },

  // Test de la connexion Neo4j
  testNeo4j: async (): Promise<any> => {
    const response = await api.get('/neo4j/test');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  }
};

// API pour les vérifications de santé
export const healthApi = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

// API pour les tests Neo4j
export const neo4jApi = {
  test: async () => {
    const response = await api.get('/neo4j/test');
    return response.data;
  }
};

// API pour les items (route de test)
export const itemsApi = {
  getItem: async (itemId: string) => {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  }
};

// API pour les films par acteur
export const actorMoviesApi = {
  getMoviesByActor: async (actorName: string) => {
    const response = await api.get(`/persons/actors/${encodeURIComponent(actorName)}/movies`);
    return response.data;
  }
};

// API pour les acteurs par film
export const movieActorsApi = {
  getActorsByMovie: async (movieTitle: string) => {
    const response = await api.get(`/movies/${encodeURIComponent(movieTitle)}/actors`);
    return response.data;
  }
};

// API pour la route root
export const rootApi = {
  getRoot: async () => {
    const response = await api.get('/');
    return response.data;
  }
};

export const authApi = {
  // Connexion utilisateur
  login: async (credentials: LoginCredentials): Promise<{access_token: string; username: string; role: string}> => {
    // FastAPI avec OAuth2PasswordRequestForm attend des données FormData
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Inscription utilisateur
  register: async (userData: RegisterData): Promise<{username: string; message?: string}> => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  // Déconnexion utilisateur (côté client)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Fonction utilitaire pour gérer les erreurs API
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Erreur de réponse HTTP
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.detail || 'Erreur inconnue';
    return `Erreur ${status}: ${message}`;
  } else if (error.request) {
    // Erreur de réseau
    return 'Erreur de réseau: Impossible de contacter le serveur';
  } else {
    // Autre erreur
    return `Erreur: ${error.message || 'Erreur inconnue'}`;
  }
};

// Hook personnalisé pour l'authentification
export const useAuth = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  
  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
  return { isAuthenticated, isAdmin, user, login, logout };
};
