import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Drawer, Toolbar, List, ListItem, ListItemIcon, ListItemText, Stack } from '@mui/material';
import zenTheme from './styles/zenTheme';
import Layout from './components/Layout';
import NotesPage from './pages/NotesPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import LedgerPage from './pages/LedgerPage';
import { useEffect, useState } from 'react';
import {
  Note as NoteIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';

const drawerWidth = 240;
const miniDrawerWidth = 64;

function Sidebar({ minimized, iconsOnly, centerIcons }: { minimized: boolean; iconsOnly: boolean; centerIcons: boolean }) {
  const location = useLocation();
  const menuItems = [
    { text: 'Notes', icon: <NoteIcon />, path: '/notes' },
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Ledger', icon: <AccountBalanceIcon />, path: '/ledger' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
  if (iconsOnly && centerIcons) {
    return (
      <Stack spacing={4} alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{ justifyContent: 'center', px: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
          </ListItem>
        ))}
      </Stack>
    );
  }
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: minimized ? miniDrawerWidth : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: minimized ? miniDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: 'width 0.2s',
        },
      }}
      open
    >
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{ justifyContent: minimized ? 'center' : 'flex-start', px: minimized ? 0 : 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
            {!minimized && !iconsOnly && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

function App() {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={zenTheme}>
      <CssBaseline />
      <Router basename={import.meta.env.BASE_URL}>
        <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', bgcolor: 'background.default' }}>
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: 72,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pt: 4,
                  pb: 4,
                },
              }}
            >
              <Sidebar minimized={true} iconsOnly centerIcons />
            </Drawer>
          ) : (
            <Sidebar minimized={sidebarMinimized} iconsOnly={false} centerIcons={false} />
          )}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0 }}>
            <Layout
              sidebarMinimized={sidebarMinimized}
              setSidebarMinimized={setSidebarMinimized}
              onHamburgerClick={isMobile ? handleDrawerToggle : undefined}
            />
            <Routes>
              <Route path="/" element={<NotesPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
