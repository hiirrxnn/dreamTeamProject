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
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  QrCodeScanner,
  Person,
  Event,
  CheckCircle,
  Warning,
  Sync,
  SyncDisabled
} from '@mui/icons-material';

import QRScanner from './QRScanner';
import AttendanceHistory from './AttendanceHistory';
import NetworkStatus from './NetworkStatus';
import attendanceService from '../services/attendanceService';
import syncService from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const AttendanceTracker = () => {
  const [user, setUser] = useState({
    id: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(!user.id || !user.name);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  
  const { isOnline, connectionQuality } = useNetworkStatus();

  useEffect(() => {
    loadStats();
    loadSyncStatus();
    
    // Set up periodic stats refresh
    const interval = setInterval(() => {
      loadStats();
      loadSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [user.id]);

  const loadStats = async () => {
    if (user.id) {
      const userStats = await attendanceService.getAttendanceStats(user.id);
      setStats(userStats);
    }
  };

  const loadSyncStatus = async () => {
    const status = await syncService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleUserSave = () => {
    if (user.id && user.name) {
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userName', user.name);
      setShowUserDialog(false);
    }
  };

  const handleScan = async (qrData) => {
    setLoading(true);
    
    try {
      // Validate QR code
      const validation = await attendanceService.validateQRCode(qrData);
      if (!validation.valid) {
        setScanResult({
          success: false,
          message: validation.error
        });
        setShowScanner(false);
        setLoading(false);
        return;
      }

      // Check for duplicate attendance
      const isDuplicate = await attendanceService.checkDuplicateAttendance(
        qrData.eventId,
        user.id
      );
      
      if (isDuplicate) {
        setScanResult({
          success: false,
          message: 'You have already marked attendance for this event'
        });
        setShowScanner(false);
        setLoading(false);
        return;
      }

      // Record attendance
      const result = await attendanceService.recordAttendance(qrData, user.id, user.name);
      
      setScanResult({
        success: result.success,
        message: result.message || result.error,
        eventName: qrData.eventName
      });
      
      if (result.success) {
        await loadStats();
        await loadSyncStatus();
      }
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: 'Failed to process attendance. Please try again.'
      });
    }
    
    setShowScanner(false);
    setLoading(false);
  };

  const handleScanError = (error) => {
    console.error('Scanner error:', error);
    setScanResult({
      success: false,
      message: 'Scanner error: ' + error.message
    });
    setShowScanner(false);
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      await syncService.forceSyncAll();
      await loadStats();
      await loadSyncStatus();
    } catch (error) {
      console.error('Force sync error:', error);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            QR Attendance Tracker
          </Typography>
          <NetworkStatus />
        </Box>

        {/* User Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Welcome, {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User ID: {user.id}
          </Typography>
          <Button
            size="small"
            onClick={() => setShowUserDialog(true)}
            sx={{ mt: 1 }}
          >
            Change User
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total || 0}
                </Typography>
                <Typography variant="body2">Total</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.today || 0}
                </Typography>
                <Typography variant="body2">Today</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.thisWeek || 0}
                </Typography>
                <Typography variant="body2">This Week</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.unsynced || 0}
                </Typography>
                <Typography variant="body2">Unsynced</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<QrCodeScanner />}
            onClick={() => setShowScanner(true)}
            disabled={loading}
            sx={{ mr: 2, mb: 2 }}
          >
            Scan QR Code
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={isOnline ? <Sync /> : <SyncDisabled />}
            onClick={handleForceSync}
            disabled={loading || !isOnline}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Sync Now'}
          </Button>
        </Box>

        {/* Sync Status */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sync Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={isOnline ? <CheckCircle /> : <Warning />}
              label={isOnline ? 'Online' : 'Offline'}
              color={isOnline ? 'success' : 'warning'}
              size="small"
            />
            <Chip
              label={`${syncStatus.pendingSync || 0} pending`}
              color={syncStatus.pendingSync > 0 ? 'warning' : 'default'}
              size="small"
            />
            <Chip
              label={`${syncStatus.unsyncedAttendance || 0} unsynced`}
              color={syncStatus.unsyncedAttendance > 0 ? 'error' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        {/* Scan Result Alert */}
        {scanResult && (
          <Alert
            severity={scanResult.success ? 'success' : 'error'}
            sx={{ mb: 3 }}
            onClose={() => setScanResult(null)}
          >
            <Typography variant="body1">
              {scanResult.message}
            </Typography>
            {scanResult.eventName && (
              <Typography variant="body2">
                Event: {scanResult.eventName}
              </Typography>
            )}
          </Alert>
        )}

        {/* Attendance History */}
        <AttendanceHistory userId={user.id} />

        {/* QR Scanner Dialog */}
        <Dialog
          open={showScanner}
          onClose={() => setShowScanner(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogContent>
            <QRScanner onScan={handleScan} onError={handleScanError} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowScanner(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Setup Dialog */}
        <Dialog
          open={showUserDialog}
          onClose={() => {}}
          disableEscapeKeyDown
        >
          <DialogTitle>User Information</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="User ID"
              fullWidth
              variant="outlined"
              value={user.id}
              onChange={(e) => setUser(prev => ({ ...prev, id: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Full Name"
              fullWidth
              variant="outlined"
              value={user.name}
              onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleUserSave}
              disabled={!user.id || !user.name}
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default AttendanceTracker;