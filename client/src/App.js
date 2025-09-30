import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container, Paper, Button, Typography } from '@mui/material';
import { School, AdminPanelSettings, Analytics } from '@mui/icons-material';
import AdminDashboard from './components/AdminDashboard';
import StudentApp from './components/StudentApp';
import AttendanceTracker from './components/AttendanceTracker';
import PerformanceDashboard from './components/PerformanceDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f8f9ff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s ease',
        },
      },
    },
  },
});

const HomePage = () => (
  <Box sx={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Animated Background Elements */}
    <Box sx={{
      position: 'absolute',
      top: -100,
      right: -100,
      width: 300,
      height: 300,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      animation: 'float 6s ease-in-out infinite'
    }} />
    <Box sx={{
      position: 'absolute',
      bottom: -50,
      left: -50,
      width: 200,
      height: 200,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.05)',
      animation: 'float 8s ease-in-out infinite reverse'
    }} />
    
    <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <Paper elevation={0} sx={{ 
        p: 6, 
        borderRadius: 5,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h3" gutterBottom sx={{ 
          mb: 2,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 800,
          letterSpacing: '-1px'
        }}>
          🎓 QR Attendance System
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 6, color: 'text.secondary', fontWeight: 400 }}>
          Choose your role to continue
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AdminPanelSettings sx={{ fontSize: 28 }} />}
            href="/admin"
            sx={{ 
              py: 3,
              borderRadius: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                👨‍🏫 Teacher/Admin
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Generate QR codes for events
              </Typography>
            </Box>
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<School sx={{ fontSize: 28 }} />}
            href="/student"
            sx={{ 
              py: 3,
              borderRadius: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderColor: 'rgba(103, 126, 234, 0.3)',
              color: '#667eea',
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                borderColor: '#667eea',
                background: 'rgba(103, 126, 234, 0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: 'inherit' }}>
                👨‍🎓 Student
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, color: 'inherit' }}>
                Scan QR codes for attendance
              </Typography>
            </Box>
          </Button>
          
          <Button
            variant="text"
            size="large"
            startIcon={<Analytics sx={{ fontSize: 28 }} />}
            href="/performance"
            sx={{ 
              py: 3,
              borderRadius: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#667eea',
              '&:hover': {
                background: 'rgba(103, 126, 234, 0.1)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: 'inherit' }}>
                📊 Performance Dashboard
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, color: 'inherit' }}>
                View QoS metrics and analytics
              </Typography>
            </Box>
          </Button>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 6, color: 'text.secondary', fontSize: '0.9rem' }}>
          Works offline • Auto-sync when online • Secure attendance tracking
        </Typography>
      </Paper>
    </Container>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: '100vh',
            bgcolor: 'grey.50',
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/student" element={<StudentApp />} />
            <Route path="/performance" element={<PerformanceDashboard />} />
            <Route path="/old" element={<AttendanceTracker />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;