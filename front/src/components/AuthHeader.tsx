import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar, Menu, MenuItem, Chip } from '@mui/material';
import { AccountCircle, Login, PersonAdd, ExitToApp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthHeader: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      const userData = JSON.parse(user);
      setUsername(userData.username);
      setUserRole(userData.role);
    }
  }, []);

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
    setShowLogin(false);
    
    // Récupérer les informations utilisateur depuis le localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUsername(userData.username);
      setUserRole(userData.role);
    }
  };

  const handleRegister = (_newUsername: string) => {
    setShowRegister(false);
    setShowLogin(true); // Rediriger vers la connexion après inscription
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUsername('');
    setUserRole('user');
    setAnchorEl(null);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { icon: '👑', label: 'Admin', color: 'error' as const };
      case 'user':
        return { icon: '👤', label: 'Utilisateur', color: 'primary' as const };
      default:
        return { icon: '👤', label: 'Utilisateur', color: 'primary' as const };
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{getRoleDisplay(userRole).icon}</Avatar>}
              label={`${getRoleDisplay(userRole).label} - ${username}`}
              color={getRoleDisplay(userRole).color}
              variant="outlined"
              onClick={handleMenuClick}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            />
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Login />}
              onClick={() => setShowLogin(true)}
              sx={{ 
                textTransform: 'none',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Se connecter
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PersonAdd />}
              onClick={() => setShowRegister(true)}
              sx={{ 
                textTransform: 'none',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              S'inscrire
            </Button>
          </Box>
        </motion.div>
      )}

      {showLogin && (
        <LoginForm
          onSuccess={handleLogin}
          onCancel={() => setShowLogin(false)}
        />
      )}

      {showRegister && (
        <RegisterForm
          onSuccess={handleRegister}
          onCancel={() => setShowRegister(false)}
        />
      )}
    </Box>
  );
};

export default AuthHeader;
