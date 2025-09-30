import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  IconButton,
  Slide,
  Zoom,
  Divider,
  Badge
} from '@mui/material';
import {
  QrCodeScanner,
  Person,
  CheckCircle,
  Schedule,
  CloudOff,
  Cloud,
  Sync,
  History,
  TrendingUp,
  School,
  Settings,
  Notifications,
  Star,
  LocalFireDepartment,
  EmojiEvents,
  AutoAwesome
} from '@mui/icons-material';

import QRScanner from './QRScanner';
import AttendanceHistory from './AttendanceHistory';
import NetworkStatus from './NetworkStatus';
import attendanceService from '../services/attendanceService';
import syncService from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const StudentApp = () => {
  const [student, setStudent] = useState({
    rollNumber: localStorage.getItem('rollNumber') || '',
    name: localStorage.getItem('studentName') || '',
    class: localStorage.getItem('studentClass') || ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(!student.rollNumber || !student.name);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (student.rollNumber) {
      loadStats();
      loadSyncStatus();
      
      // Periodic refresh
      const interval = setInterval(() => {
        loadStats();
        loadSyncStatus();
      }, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [student.rollNumber]);

  const loadStats = async () => {
    if (student.rollNumber) {
      try {
        const userStats = await attendanceService.getAttendanceStats(student.rollNumber);
        setStats(userStats);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleStudentSave = () => {
    if (student.rollNumber && student.name) {
      localStorage.setItem('rollNumber', student.rollNumber);
      localStorage.setItem('studentName', student.name);
      localStorage.setItem('studentClass', student.class);
      setShowSetupDialog(false);
    }
  };

  const handleScan = async (qrData) => {
    setLoading(true);
    
    try {
      console.log('Scanned QR Data:', qrData);
      
      // Validate QR code
      const validation = await attendanceService.validateQRCode(qrData);
      if (!validation.valid) {
        setScanResult({
          success: false,
          message: validation.error,
          type: 'error'
        });
        setShowScanner(false);
        setLoading(false);
        return;
      }

      // Check for duplicate attendance
      const isDuplicate = await attendanceService.checkDuplicateAttendance(
        qrData.eventId,
        student.rollNumber
      );
      
      if (isDuplicate) {
        setScanResult({
          success: false,
          message: `You have already marked attendance for "${qrData.eventName}"`,
          type: 'warning'
        });
        setShowScanner(false);
        setLoading(false);
        return;
      }

      // Record attendance
      const result = await attendanceService.recordAttendance(
        qrData, 
        student.rollNumber, 
        student.name
      );
      
      setScanResult({
        success: result.success,
        message: result.success 
          ? `✅ Attendance marked for "${qrData.eventName}"` 
          : result.error,
        type: result.success ? 'success' : 'error',
        eventName: qrData.eventName,
        isOffline: !isOnline
      });
      
      if (result.success) {
        await loadStats();
        await loadSyncStatus();
      }
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: 'Failed to process attendance. Please try again.',
        type: 'error'
      });
    }
    
    setShowScanner(false);
    setLoading(false);
  };

  const handleScanError = (error) => {
    console.error('Scanner error:', error);
    setScanResult({
      success: false,
      message: 'Camera error: ' + error.message,
      type: 'error'
    });
    setShowScanner(false);
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      await syncService.forceSyncAll();
      await loadStats();
      await loadSyncStatus();
      setScanResult({
        success: true,
        message: 'Data synchronized successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Force sync error:', error);
      setScanResult({
        success: false,
        message: 'Sync failed. Will retry automatically.',
        type: 'error'
      });
    }
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: '🌅', color: '#FF6B35' };
    if (hour < 17) return { text: 'Good Afternoon', icon: '☀️', color: '#F7931E' };
    return { text: 'Good Evening', icon: '🌙', color: '#6C5CE7' };
  };

  const greeting = getGreeting();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      
      <Container maxWidth="sm" sx={{ py: 2, position: 'relative', zIndex: 1 }}>
        {/* Enhanced Header */}
        <Zoom in timeout={800}>
          <Card sx={{ 
            mb: 3, 
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <AutoAwesome sx={{ fontSize: 32, color: '#667eea', mr: 1 }} />
                <Typography variant="h4" component="h1" sx={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  letterSpacing: '-0.5px'
                }}>
                  QR Attendance
                </Typography>
              </Box>
              <NetworkStatus />
            </CardContent>
          </Card>
        </Zoom>

        {/* Enhanced Student Info Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            mb: 3, 
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                      border: '2px solid white',
                      animation: 'pulse 2s infinite'
                    }} />
                  }
                >
                  <Avatar sx={{ 
                    width: 64, 
                    height: 64, 
                    mr: 2,
                    background: `linear-gradient(45deg, ${greeting.color}, #667eea)`,
                    fontSize: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                  }}>
                    <School />
                  </Avatar>
                </Badge>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600,
                    color: greeting.color,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {greeting.icon} {greeting.text}, {student.name}!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    Roll No: <Chip label={student.rollNumber} size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class: {student.class}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => setShowSetupDialog(true)}
                  sx={{ 
                    background: 'rgba(103, 126, 234, 0.1)',
                    '&:hover': { background: 'rgba(103, 126, 234, 0.2)' }
                  }}
                >
                  <Settings sx={{ color: '#667eea' }} />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Slide>

        {/* Enhanced Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {[
            { 
              value: stats.total || 0, 
              label: 'Total', 
              icon: <EmojiEvents />, 
              color: '#667eea',
              bgGradient: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            { 
              value: stats.today || 0, 
              label: 'Today', 
              icon: <LocalFireDepartment />, 
              color: '#4CAF50',
              bgGradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)'
            },
            { 
              value: stats.unsynced || 0, 
              label: 'Pending', 
              icon: <Sync />, 
              color: '#FF9800',
              bgGradient: 'linear-gradient(135deg, #FF9800, #FFB74D)'
            }
          ].map((stat, index) => (
            <Zoom in timeout={1200 + index * 200} key={stat.label}>
              <Card sx={{ 
                flex: 1, 
                textAlign: 'center',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease'
                }
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: stat.bgGradient
                }} />
                <CardContent sx={{ py: 3, px: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}>
                      {React.cloneElement(stat.icon, { 
                        sx: { color: stat.color, fontSize: 24 } 
                      })}
                    </Box>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 700,
                      background: stat.bgGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>
          ))}
        </Box>

      {/* Sync Status */}
      {(stats.unsynced > 0 || !isOnline) && (
        <Alert 
          severity={isOnline ? "warning" : "info"} 
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            isOnline && (
              <Button color="inherit" size="small" onClick={handleForceSync}>
                <Sync /> Sync
              </Button>
            )
          }
        >
          {isOnline 
            ? `${stats.unsynced} attendance records pending sync`
            : 'Working offline - will sync when connected'
          }
        </Alert>
      )}

      {/* Scan Result Alert */}
      {scanResult && (
        <Alert
          severity={scanResult.type}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setScanResult(null)}
          icon={scanResult.success ? <CheckCircle /> : undefined}
        >
          <Typography variant="body1">
            {scanResult.message}
          </Typography>
          {scanResult.isOffline && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              📱 Saved offline - will sync automatically
            </Typography>
          )}
        </Alert>
      )}

        {/* Enhanced Main Action Buttons */}
        <Slide direction="up" in timeout={1600}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<QrCodeScanner sx={{ fontSize: 28 }} />}
              onClick={() => setShowScanner(true)}
              disabled={loading}
              sx={{ 
                borderRadius: 4, 
                py: 3,
                mb: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)'
                },
                '&:active': {
                  transform: 'translateY(0px)'
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.6s'
                },
                '&:hover:before': {
                  left: '100%'
                }
              }}
            >
              {loading ? 'Processing...' : 'Scan QR Code'}
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<History />}
                onClick={() => setShowHistory(true)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  borderColor: 'rgba(103, 126, 234, 0.3)',
                  color: '#667eea',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: '#667eea',
                    background: 'rgba(103, 126, 234, 0.1)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                View History
              </Button>
              
              <Button
                variant="outlined"
                startIcon={isOnline ? <Cloud /> : <CloudOff />}
                sx={{
                  minWidth: 120,
                  borderRadius: 3,
                  py: 1.5,
                  borderColor: isOnline ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)',
                  color: isOnline ? '#4CAF50' : '#FF9800',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'default',
                  '&:hover': {
                    borderColor: isOnline ? '#4CAF50' : '#FF9800',
                    background: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'
                  }
                }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Button>
            </Box>
          </Box>
        </Slide>

      {/* QR Scanner Dialog */}
      <Dialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          📸 Scan QR Code
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Point your camera at the QR code displayed by your teacher
          </Alert>
          <QRScanner onScan={handleScan} onError={handleScanError} />
          
          {/* Manual QR data input for testing */}
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              🔧 Testing: Manual QR Data Entry
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder='{"eventId":"test-event-001","eventName":"Test Event","timestamp":"2025-09-29T18:00:00.000Z","type":"attendance"}'
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  try {
                    const qrData = JSON.parse(e.target.value);
                    handleScan(qrData);
                    e.target.value = '';
                  } catch (err) {
                    alert('Invalid JSON format');
                  }
                }
              }}
              helperText="Paste QR JSON data and press Enter (for testing)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScanner(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Setup Dialog */}
      <Dialog
        open={showSetupDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>📝 Student Information</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Roll Number"
            fullWidth
            variant="outlined"
            value={student.rollNumber}
            onChange={(e) => setStudent(prev => ({ ...prev, rollNumber: e.target.value }))}
            sx={{ mb: 2 }}
            helperText="Your unique roll number (e.g., 2024001)"
          />
          <TextField
            margin="dense"
            label="Full Name"
            fullWidth
            variant="outlined"
            value={student.name}
            onChange={(e) => setStudent(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Class/Section"
            fullWidth
            variant="outlined"
            value={student.class}
            onChange={(e) => setStudent(prev => ({ ...prev, class: e.target.value }))}
            helperText="e.g., CSE-A, ECE-B"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleStudentSave}
            disabled={!student.rollNumber || !student.name}
            variant="contained"
            fullWidth
          >
            Save Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>📚 Attendance History</DialogTitle>
        <DialogContent>
          <AttendanceHistory userId={student.rollNumber} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Sync Button */}
      {stats.unsynced > 0 && isOnline && (
        <Fab
          color="secondary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleForceSync}
          disabled={loading}
        >
          <Sync />
        </Fab>
      )}
    </Container>
    </Box>
  );
};

export default StudentApp;