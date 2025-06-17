import { createTheme } from '@mui/material/styles';

const zenTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f7f8fa', // soft off-white
      paper: '#ffffff',
    },
    primary: {
      main: '#7bb7c6', // soft blue-green
      contrastText: '#fff',
    },
    secondary: {
      main: '#b39ddb', // soft purple
    },
    text: {
      primary: '#222',
      secondary: '#7a7a7a',
      disabled: '#bdbdbd',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: 'Nunito, Inter, Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    body2: {
      color: '#7a7a7a',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px 0 rgba(60,72,88,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          background: 'linear-gradient(135deg, #b39ddb 0%, #7bb7c6 100%)',
          color: '#fff',
          boxShadow: '0 4px 16px 0 rgba(123,183,198,0.15)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          padding: '8px 0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: '#f0f4f8',
          color: '#7a7a7a',
        },
      },
    },
  },
});

export default zenTheme; 