// Utilitaires pour l'authentification
export const authUtils = {
  // Vérifier si l'utilisateur est connecté
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtenir le token d'authentification
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Obtenir les informations utilisateur
  getUser: (): {username: string; role: string} | null => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Vérifier si l'utilisateur est admin
  isAdmin: (): boolean => {
    const user = authUtils.getUser();
    return user?.role === 'admin';
  },

  // Obtenir le nom d'utilisateur
  getUsername: (): string | null => {
    const user = authUtils.getUser();
    return user?.username || null;
  },

  // Obtenir le rôle utilisateur
  getRole: (): string => {
    const user = authUtils.getUser();
    return user?.role || 'user';
  },

  // Nettoyer les données d'authentification
  clearAuth: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Vérifier si le token est expiré (basique)
  isTokenExpired: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return true;

    try {
      // Décoder le JWT pour vérifier l'expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
};

// Hook personnalisé pour l'authentification
export const useAuth = () => {
  const isAuthenticated = authUtils.isAuthenticated();
  const user = authUtils.getUser();
  const isAdmin = authUtils.isAdmin();
  const username = authUtils.getUsername();
  const role = authUtils.getRole();

  return {
    isAuthenticated,
    user,
    isAdmin,
    username,
    role,
    login: (token: string, userData: {username: string; role: string}) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    },
    logout: () => {
      authUtils.clearAuth();
      window.location.reload();
    }
  };
};

// Composant de protection des routes
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, requireAdmin = false, fallback }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return fallback || (
      <div className="auth-required">
        <h2>🔐 Authentification requise</h2>
        <p>Veuillez vous connecter pour accéder à cette section.</p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="admin-required">
        <h2>👑 Accès administrateur requis</h2>
        <p>Vous devez être administrateur pour accéder à cette section.</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Types pour les permissions
export type Permission = 'read' | 'write' | 'delete' | 'admin';

// Système de permissions
export const permissionUtils = {
  // Vérifier si l'utilisateur a une permission spécifique
  hasPermission: (permission: Permission): boolean => {
    const role = authUtils.getRole();
    
    switch (permission) {
      case 'read':
        return true; // Tous les utilisateurs peuvent lire
      case 'write':
        return authUtils.isAuthenticated(); // Seuls les utilisateurs connectés peuvent écrire
      case 'delete':
        return authUtils.isAdmin(); // Seuls les admins peuvent supprimer
      case 'admin':
        return authUtils.isAdmin(); // Seuls les admins ont accès aux fonctions admin
      default:
        return false;
    }
  },

  // Obtenir les permissions d'un rôle
  getRolePermissions: (role: string): Permission[] => {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'admin'];
      case 'user':
        return ['read', 'write'];
      default:
        return ['read'];
    }
  }
};

// Composant pour afficher du contenu conditionnel selon les permissions
export const PermissionGate: React.FC<{
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}> = ({ children, permission, fallback }) => {
  const hasPermission = permissionUtils.hasPermission(permission);
  
  if (!hasPermission) {
    return fallback || null;
  }
  
  return <>{children}</>;
};
