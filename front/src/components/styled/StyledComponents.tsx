import React from 'react';
import { Box, styled } from '@mui/material';

// Container principal avec gradient animé
export const GradientContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `
    linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      #1a1a2e 50%, 
      #0f0f23 100%
    )
  `,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)
    `,
    animation: 'gradientShift 20s ease infinite',
  },
  '@keyframes gradientShift': {
    '0%, 100%': {
      transform: 'translate(0, 0) rotate(0deg)',
    },
    '33%': {
      transform: 'translate(30px, -30px) rotate(120deg)',
    },
    '66%': {
      transform: 'translate(-20px, 20px) rotate(240deg)',
    },
  },
}));

// Container de contenu avec glass effect
export const GlassContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(26, 26, 46, 0.7)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99, 102, 241, 0.1)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  position: 'relative',
  zIndex: 1,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    border: '1px solid rgba(99, 102, 241, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  },
}));

// Titre avec effet néon
export const NeonTitle = styled('h1')(({ theme }) => ({
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textAlign: 'center',
  fontSize: '3rem',
  fontWeight: 700,
  marginBottom: theme.spacing(2),
  textShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100px',
    height: '4px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '2px',
    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
  },
}));

// Bouton avec effet hover magnifique
export const StyledButton = styled('button')(({ theme }) => ({
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  color: 'white',
  fontSize: '1rem',
  fontWeight: 500,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Card avec animation
export const AnimatedCard = styled(Box)(({ theme }) => ({
  background: 'rgba(26, 26, 46, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(99, 102, 241, 0.1)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
}));

// Indicateur de statut avec pulsation
export const StatusIndicator = styled(Box)<{ status: 'success' | 'error' | 'warning' | 'info' }>(
  ({ theme, status }) => {
    const colors = {
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
    };
    
    return {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      position: 'relative',
      display: 'inline-block',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px',
        bottom: '-2px',
        borderRadius: '50%',
        border: `2px solid ${colors[status]}`,
        animation: 'pulse 2s infinite',
        opacity: 0.6,
      },
      '@keyframes pulse': {
        '0%': {
          transform: 'scale(1)',
          opacity: 0.6,
        },
        '50%': {
          transform: 'scale(1.2)',
          opacity: 0.3,
        },
        '100%': {
          transform: 'scale(1)',
          opacity: 0.6,
        },
      },
    };
  }
);

// Loader avec animation
export const LoadingSpinner = styled(Box)(({ theme }) => ({
  width: '40px',
  height: '40px',
  border: '4px solid rgba(99, 102, 241, 0.2)',
  borderTop: '4px solid #6366f1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
}));

export default {
  GradientContainer,
  GlassContainer,
  NeonTitle,
  StyledButton,
  AnimatedCard,
  StatusIndicator,
  LoadingSpinner,
};
