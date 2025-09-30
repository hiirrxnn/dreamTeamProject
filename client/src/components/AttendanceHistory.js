import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
  Collapse,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  ExpandLess,
  ExpandMore,
  Event,
  SyncDisabled,
  Sync
} from '@mui/icons-material';
import attendanceService from '../services/attendanceService';

const AttendanceHistory = ({ userId }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAttendanceHistory();
  }, [userId]);

  const loadAttendanceHistory = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const history = await attendanceService.getAttendanceHistory(userId);
      setAttendance(history);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
    setLoading(false);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTimeDifference = (timestamp) => {
    const now = new Date();
    const recordTime = new Date(timestamp);
    const diffInHours = Math.abs(now - recordTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const recentAttendance = attendance.slice(0, 3);
  const olderAttendance = attendance.slice(3);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading attendance history...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Event sx={{ mr: 1 }} />
        <Typography variant="h6">Attendance History</Typography>
        <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>
          {attendance.length} records
        </Typography>
      </Box>

      {attendance.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body1">
            No attendance records found
          </Typography>
          <Typography variant="body2">
            Scan a QR code to get started
          </Typography>
        </Box>
      ) : (
        <>
          <List disablePadding>
            {recentAttendance.map((record, index) => {
              const { date, time } = formatDateTime(record.timestamp);
              
              return (
                <ListItem key={record.id || index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body1" component="span">
                          {record.eventName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!record.synced && (
                            <Chip
                              icon={<SyncDisabled />}
                              label="Offline"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          {record.synced && (
                            <Chip
                              icon={<Sync />}
                              label="Synced"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {date} at {time}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getTimeDifference(record.timestamp)}
                          {record.location && (
                            <> • Location recorded</>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          {olderAttendance.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  size="small"
                >
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {expanded ? 'Show Less' : `Show ${olderAttendance.length} More`}
                  </Typography>
                  {expanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {olderAttendance.map((record, index) => {
                    const { date, time } = formatDateTime(record.timestamp);
                    
                    return (
                      <ListItem key={record.id || `older-${index}`} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Schedule color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="body2" component="span">
                                {record.eventName}
                              </Typography>
                              {!record.synced && (
                                <Chip
                                  icon={<SyncDisabled />}
                                  label="Offline"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {date} at {time} • {getTimeDifference(record.timestamp)}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default AttendanceHistory;