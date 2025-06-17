import { type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children?: ReactNode;
  sidebarMinimized: boolean;
  setSidebarMinimized: (minimized: boolean) => void;
}

export default function Layout({ children, sidebarMinimized, setSidebarMinimized }: LayoutProps) {
  const handleDrawerToggle = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const drawerWidth = 240;
  const miniDrawerWidth = 64;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${sidebarMinimized ? miniDrawerWidth : drawerWidth}px)`,
          ml: `${sidebarMinimized ? miniDrawerWidth : drawerWidth}px`,
          transition: 'width 0.2s, margin-left 0.2s',
          boxShadow: 'none',
          background: '#7bb7c6',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            My Notes & Finance
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 3,
          width: '100%',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
} 