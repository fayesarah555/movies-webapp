// Constantes pour l'application
export const APP_CONFIG = {
  API_TIMEOUT: 10000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// Status codes HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Couleurs pour les status
export const STATUS_COLORS = {
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  SECONDARY: '#9E9E9E',
} as const;

// Utilitaires de formatage
export const formatUtils = {
  // Formater un timestamp
  formatTimestamp: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },

  // Formater une durée en millisecondes
  formatDuration: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  },

  // Formater un nombre avec des séparateurs
  formatNumber: (num: number): string => {
    return num.toLocaleString('fr-FR');
  },

  // Tronquer un texte
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  },

  // Capitaliser la première lettre
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
};

// Utilitaires pour les couleurs
export const colorUtils = {
  // Obtenir la couleur selon le status HTTP
  getStatusColor: (status: number): string => {
    if (status === 0) return STATUS_COLORS.ERROR;
    if (status < 300) return STATUS_COLORS.SUCCESS;
    if (status < 400) return STATUS_COLORS.WARNING;
    if (status < 500) return STATUS_COLORS.ERROR;
    return STATUS_COLORS.ERROR;
  },

  // Obtenir la couleur selon le temps de réponse
  getResponseTimeColor: (time: number): string => {
    if (time < 200) return STATUS_COLORS.SUCCESS;
    if (time < 500) return STATUS_COLORS.WARNING;
    return STATUS_COLORS.ERROR;
  },

  // Générer une couleur aléatoire
  getRandomColor: (): string => {
    const colors = Object.values(STATUS_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
  },
};

// Utilitaires de validation
export const validationUtils = {
  // Valider une URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Valider un email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Valider une chaîne non vide
  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },

  // Valider un nombre
  isValidNumber: (value: any): boolean => {
    return !isNaN(value) && isFinite(value);
  },
};

// Utilitaires de stockage local
export const storageUtils = {
  // Sauvegarder dans localStorage avec gestion d'erreurs
  setItem: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  },

  // Récupérer depuis localStorage avec gestion d'erreurs
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return defaultValue;
    }
  },

  // Supprimer un élément
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  },

  // Vider le localStorage
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return false;
    }
  },
};

// Utilitaires pour les promesses
export const promiseUtils = {
  // Délai
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Retry avec délai exponentiel
  retry: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = APP_CONFIG.MAX_RETRIES,
    delay: number = APP_CONFIG.RETRY_DELAY
  ): Promise<T> => {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await promiseUtils.delay(delay * Math.pow(2, i));
        }
      }
    }
    
    throw lastError!;
  },

  // Timeout pour une promesse
  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      ),
    ]);
  },
};

// Utilitaires pour les objets
export const objectUtils = {
  // Vérifier si un objet est vide
  isEmpty: (obj: any): boolean => {
    return Object.keys(obj).length === 0;
  },

  // Cloner profondément un objet
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Fusionner deux objets
  merge: <T extends object, U extends object>(target: T, source: U): T & U => {
    return { ...target, ...source };
  },

  // Extraire certaines propriétés d'un objet
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omettre certaines propriétés d'un objet
  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },
};

// Types utilitaires
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

// Constantes pour les messages
export const MESSAGES = {
  LOADING: 'Chargement...',
  ERROR: 'Une erreur s\'est produite',
  NO_DATA: 'Aucune donnée disponible',
  NETWORK_ERROR: 'Erreur de réseau',
  TIMEOUT: 'Délai d\'attente dépassé',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  SERVER_ERROR: 'Erreur du serveur',
} as const;
