import { type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children?: ReactNode;
  sidebarMinimized: boolean;
  setSidebarMinimized: (minimized: boolean) => void;
  onHamburgerClick?: () => void;
}

export default function Layout({ children, sidebarMinimized, setSidebarMinimized, onHamburgerClick }: LayoutProps) {
  const handleDrawerToggle = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const theme = useTheme();

  const drawerWidth = 240;
  const miniDrawerWidth = 64;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', sm: `calc(100% - ${sidebarMinimized ? miniDrawerWidth : drawerWidth}px)` },
          ml: { xs: 0, sm: `${sidebarMinimized ? miniDrawerWidth : drawerWidth}px` },
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
            onClick={onHamburgerClick || handleDrawerToggle}
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