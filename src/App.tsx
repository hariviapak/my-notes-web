import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Drawer, Toolbar, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
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

const drawerWidth = 240;
const miniDrawerWidth = 64;

function Sidebar({ minimized }: { minimized: boolean }) {
  const location = useLocation();
  const menuItems = [
    { text: 'Notes', icon: <NoteIcon />, path: '/notes' },
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Ledger', icon: <AccountBalanceIcon />, path: '/ledger' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];
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
            {!minimized && <ListItemText primary={item.text} />}
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

function App() {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <ThemeProvider theme={zenTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', width: '100vw', minHeight: '100vh', bgcolor: 'background.default' }}>
          <Sidebar minimized={sidebarMinimized} />
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0 }}>
            <Layout sidebarMinimized={sidebarMinimized} setSidebarMinimized={setSidebarMinimized} />
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
