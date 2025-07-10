import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '@mui/material';

export const NotificationProvider: React.FC = () => {
  const theme = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
        },
        success: {
          style: {
            border: `1px solid ${theme.palette.success.main}`,
          },
          iconTheme: {
            primary: theme.palette.success.main,
            secondary: theme.palette.background.paper,
          },
        },
        error: {
          style: {
            border: `1px solid ${theme.palette.error.main}`,
          },
          iconTheme: {
            primary: theme.palette.error.main,
            secondary: theme.palette.background.paper,
          },
        },
        loading: {
          style: {
            border: `1px solid ${theme.palette.info.main}`,
          },
          iconTheme: {
            primary: theme.palette.info.main,
            secondary: theme.palette.background.paper,
          },
        },
      }}
    />
  );
};

export default NotificationProvider;
