import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Movie,
  Search,
  Settings,
  Notifications,
  AccountCircle,
  ExitToApp,
  AdminPanelSettings,
  Assessment,
  BugReport,
  MonitorHeart,
  Science,
  People,
  Recommend,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../api';
import toast from 'react-hot-toast';

interface ModernNavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const ModernNavbar: React.FC<ModernNavbarProps> = ({ currentTab, onTabChange }) => {
  const theme = useTheme();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCount] = useState(3); // Simulated notification count

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    toast.success('Déconnexion réussie!');
  };

  const navigationItems = [
    { id: 'movies', label: 'Films', icon: Movie },
    { id: 'search', label: 'Recherche', icon: Search },
    { id: 'recommendations', label: 'Recommandations', icon: Recommend },
    { id: 'persons', label: 'Personnes', icon: People },
    { id: 'collaborations', label: 'Collaborations', icon: TrendingUp },
    ...(isAdmin ? [
      { id: 'admin', label: 'Administration', icon: AdminPanelSettings },
      { id: 'stats', label: 'Statistiques', icon: Assessment },
      { id: 'health', label: 'Santé', icon: MonitorHeart },
      { id: 'tester', label: 'Tests API', icon: Science },
      { id: 'devtools', label: 'Outils Dev', icon: BugReport },
    ] : []),
  ];

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        onClick={() => onTabChange(item.id)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          mx: 1,
          borderRadius: 2,
          cursor: 'pointer',
          position: 'relative',
          background: isActive
            ? alpha(theme.palette.primary.main, 0.15)
            : 'transparent',
          border: isActive
            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            : '1px solid transparent',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <item.icon
          sx={{
            mr: 1,
            color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
            transition: 'color 0.3s ease-in-out',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
            fontWeight: isActive ? 600 : 400,
            transition: 'color 0.3s ease-in-out',
          }}
        >
          {item.label}
        </Typography>
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            style={{
              position: 'absolute',
              bottom: -2,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              borderRadius: 1,
            }}
          />
        )}
      </Box>
    </motion.div>
  );

  return (
    <AppBar
      position="sticky"
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.9)} 0%, 
          ${alpha(theme.palette.background.paper, 0.95)} 100%
        )`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo et titre */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Movie
                sx={{
                  mr: 2,
                  fontSize: 32,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              />
            </motion.div>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CineVerse
            </Typography>
          </Box>
        </motion.div>

        {/* Navigation */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navigationItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentTab === item.id}
                />
              ))}
            </Box>
          </motion.div>
        )}

        {/* Actions utilisateur */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Notifications">
                <IconButton>
                  <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Profil">
                <IconButton onClick={handleProfileMenuOpen}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    background: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 2,
                    minWidth: 200,
                  },
                }}
              >
                <MenuItem onClick={handleProfileMenuClose}>
                  <AccountCircle sx={{ mr: 2 }} />
                  Profil
                </MenuItem>
                <MenuItem onClick={handleProfileMenuClose}>
                  <Settings sx={{ mr: 2 }} />
                  Paramètres
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 2 }} />
                  Déconnexion
                </MenuItem>
              </Menu>
            </Box>
          </motion.div>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default ModernNavbar;
