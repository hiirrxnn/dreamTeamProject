import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
  Fab,
  Avatar,
  IconButton,
  Zoom,
  Slide,
  Badge,
  LinearProgress,
  CardActions,
  Tooltip
} from '@mui/material';
import {
  QrCode,
  Event,
  People,
  Download,
  Refresh,
  Add,
  School,
  Analytics,
  TrendingUp,
  Group,
  EventNote,
  Schedule,
  LocationOn,
  Visibility,
  Share,
  Close,
  AutoAwesome,
  Star,
  EmojiEvents,
  LocalFireDepartment
} from '@mui/icons-material';
import { generateAttendanceQR } from '../utils/qrCodeGenerator';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: ''
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [selectedEventAttendees, setSelectedEventAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    loadEvents();
    loadAttendanceStats();
  }, []);

  const loadEvents = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/events`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadAttendanceStats = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const stats = {};
      for (const event of events) {
        const response = await fetch(`${API_BASE_URL}/attendance/event/${event.id}`);
        const data = await response.json();
        stats[event.id] = data.totalCount || 0;
      }
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const createEvent = async () => {
    try {
      const eventData = {
        id: `event-${Date.now()}`,
        name: newEvent.name,
        description: newEvent.description,
        date: new Date(newEvent.date).toISOString(),
        startTime: new Date(`${newEvent.date}T${newEvent.startTime}`).toISOString(),
        endTime: new Date(`${newEvent.date}T${newEvent.endTime}`).toISOString(),
        location: { name: newEvent.location }
      };

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        setNewEvent({
          name: '', description: '', date: '', startTime: '', endTime: '', location: ''
        });
        await loadEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const generateQRCode = async (event) => {
    try {
      const qrData = await generateAttendanceQR(event.id, event.name);
      setQrCodeUrl(qrData);
      setSelectedEvent(event);
      setShowQRDialog(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `${selectedEvent.name}-QR.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedEvent.name} - QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { margin: 20px 0; }
            .event-info { margin: 20px 0; }
            img { max-width: 400px; border: 2px solid #ccc; padding: 10px; }
          </style>
        </head>
        <body>
          <h1>${selectedEvent.name}</h1>
          <div class="event-info">
            <p><strong>Date:</strong> ${new Date(selectedEvent.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(selectedEvent.startTime).toLocaleTimeString()} - ${new Date(selectedEvent.endTime).toLocaleTimeString()}</p>
            <p><strong>Location:</strong> ${selectedEvent.location?.name || 'TBD'}</p>
          </div>
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QR Code" />
            <p><strong>Scan this QR code to mark your attendance</strong></p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const fetchEventAttendees = async (event) => {
    setLoadingAttendees(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/attendance/event/${event.id}`);
      const data = await response.json();
      
      setSelectedEventAttendees(data.attendance || []);
      setSelectedEvent(event);
      setShowAttendeesDialog(true);
    } catch (error) {
      console.error('Error fetching attendees:', error);
      setSelectedEventAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

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
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        animation: 'float 8s ease-in-out infinite'
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        animation: 'float 10s ease-in-out infinite reverse'
      }} />

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Enhanced Header */}
        <Zoom in timeout={800}>
          <Card sx={{
            mb: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ py: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      width: 80,
                      height: 80,
                      mr: 3,
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      fontSize: 32,
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                    }}>
                      <School />
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="h3" sx={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 800,
                      letterSpacing: '-1px',
                      mb: 1
                    }}>
                      Admin Dashboard
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      QR Attendance Management System
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="Analytics">
                    <IconButton sx={{
                      background: 'rgba(103, 126, 234, 0.1)',
                      '&:hover': { background: 'rgba(103, 126, 234, 0.2)' }
                    }}>
                      <Analytics sx={{ color: '#667eea' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Refresh Data">
                    <IconButton onClick={() => { loadEvents(); loadAttendanceStats(); }} sx={{
                      background: 'rgba(103, 126, 234, 0.1)',
                      '&:hover': { background: 'rgba(103, 126, 234, 0.2)' }
                    }}>
                      <Refresh sx={{ color: '#667eea' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Zoom>

        {/* Stats Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: 'Total Events',
              value: events.length,
              icon: <EventNote />,
              color: '#667eea',
              bgGradient: 'linear-gradient(135deg, #667eea, #764ba2)'
            },
            {
              title: 'Active Events',
              value: events.filter(e => new Date(e.endTime) > new Date()).length,
              icon: <LocalFireDepartment />,
              color: '#4CAF50',
              bgGradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)'
            },
            {
              title: 'Total Attendance',
              value: attendanceStats.totalAttendance || 0,
              icon: <People />,
              color: '#FF9800',
              bgGradient: 'linear-gradient(135deg, #FF9800, #FFB74D)'
            },
            {
              title: 'This Week',
              value: attendanceStats.thisWeek || 0,
              icon: <EmojiEvents />,
              color: '#9C27B0',
              bgGradient: 'linear-gradient(135deg, #9C27B0, #BA68C8)'
            }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Zoom in timeout={1000 + index * 200}>
                <Card sx={{
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    transition: 'transform 0.3s ease',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
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
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: `${stat.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {React.cloneElement(stat.icon, {
                          sx: { color: stat.color, fontSize: 32 }
                        })}
                      </Box>
                    </Box>
                    <Typography variant="h3" sx={{
                      fontWeight: 700,
                      background: stat.bgGradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                      mb: 1
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Create Event Section */}
        <Slide direction="up" in timeout={1400}>
          <Card sx={{
            mb: 4,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Box sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                }}>
                  <Add sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
                  Create New Event
                </Typography>
              </Box>
        
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: <EventNote sx={{ color: '#667eea', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ color: '#667eea', mr: 1 }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&:hover fieldset': {
                          borderColor: '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea'
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={createEvent}
                  disabled={!newEvent.name || !newEvent.date}
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)'
                    }
                  }}
                  startIcon={<Add />}
                >
                  Create Event
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Slide>

        {/* Events List */}
        <Slide direction="up" in timeout={1800}>
          <Card sx={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  }}>
                    <Event sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
                    Events & QR Codes
                  </Typography>
                </Box>
                <Tooltip title="Refresh Events">
                  <IconButton 
                    onClick={() => { loadEvents(); loadAttendanceStats(); }}
                    sx={{
                      background: 'rgba(103, 126, 234, 0.1)',
                      '&:hover': { 
                        background: 'rgba(103, 126, 234, 0.2)',
                        transform: 'rotate(180deg)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Refresh sx={{ color: '#667eea' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {events.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  background: 'rgba(103, 126, 234, 0.05)',
                  borderRadius: 3,
                  border: '2px dashed rgba(103, 126, 234, 0.2)'
                }}>
                  <Box sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(103, 126, 234, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}>
                    <AutoAwesome sx={{ fontSize: 64, color: '#667eea' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#667eea', mb: 1, fontWeight: 600 }}>
                    No events created yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Create your first event above to get started with QR attendance tracking
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {events.map((event, index) => (
                    <Grid item xs={12} lg={6} key={event.id}>
                      <Zoom in timeout={2000 + index * 200}>
                        <Card sx={{
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(15px)',
                          borderRadius: 3,
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            transition: 'transform 0.3s ease',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                          }
                        }}>
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: new Date(event.endTime) > new Date() 
                              ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                              : 'linear-gradient(90deg, #FF9800, #FFB74D)'
                          }} />
                          
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 600, 
                                  color: '#667eea',
                                  mb: 1,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  <Star sx={{ mr: 1, fontSize: 20 }} />
                                  {event.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                                  {event.description}
                                </Typography>
                              </Box>
                              <Chip 
                                label={new Date(event.endTime) > new Date() ? 'Active' : 'Ended'}
                                size="small"
                                sx={{
                                  background: new Date(event.endTime) > new Date() 
                                    ? 'linear-gradient(45deg, #4CAF50, #8BC34A)'
                                    : 'linear-gradient(45deg, #FF9800, #FFB74D)',
                                  color: 'white',
                                  fontWeight: 600,
                                  ml: 2
                                }}
                              />
                            </Box>
                            
                            <Box sx={{ 
                              background: 'rgba(103, 126, 234, 0.05)', 
                              borderRadius: 2, 
                              p: 2, 
                              mb: 3
                            }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Schedule sx={{ color: '#667eea', fontSize: 16, mr: 1 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                      DATE
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {new Date(event.date).toLocaleDateString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocationOn sx={{ color: '#667eea', fontSize: 16, mr: 1 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                      LOCATION
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {event.location?.name || 'TBD'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Schedule sx={{ color: '#667eea', fontSize: 16, mr: 1 }} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                      TIME
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                    {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Button
                                variant="text"
                                onClick={() => fetchEventAttendees(event)}
                                disabled={loadingAttendees}
                                sx={{
                                  p: 0,
                                  minWidth: 'auto',
                                  '&:hover': {
                                    background: 'rgba(103, 126, 234, 0.1)',
                                    borderRadius: 2
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                                  <Badge
                                    badgeContent={attendanceStats[event.id] || 0}
                                    color="primary"
                                    sx={{
                                      '& .MuiBadge-badge': {
                                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                        color: 'white',
                                        fontWeight: 600
                                      }
                                    }}
                                  >
                                    <Box sx={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: '50%',
                                      background: 'rgba(103, 126, 234, 0.1)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <People sx={{ color: '#667eea', fontSize: 20 }} />
                                    </Box>
                                  </Badge>
                                  <Typography variant="body2" sx={{ ml: 2, fontWeight: 600, color: 'text.secondary' }}>
                                    Attendees
                                  </Typography>
                                </Box>
                              </Button>
                              
                              <Button
                                variant="contained"
                                startIcon={<QrCode />}
                                onClick={() => generateQRCode(event)}
                                sx={{
                                  px: 3,
                                  py: 1.5,
                                  borderRadius: 3,
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                Generate QR
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Slide>

      {/* QR Code Dialog */}
      <Dialog
        open={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          QR Code - {selectedEvent?.name}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {qrCodeUrl && (
            <Box>
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{
                  maxWidth: '300px',
                  border: '2px solid #ccc',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}
              />
              
              <Typography variant="h6" gutterBottom>
                📱 Students: Scan this QR code to mark attendance
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <strong>Instructions:</strong>
                <br />• Students scan this QR code with their mobile app
                <br />• Attendance works offline and syncs automatically
                <br />• QR code is valid for the event duration
                <br />• Each student can scan only once per event
              </Alert>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={downloadQRCode}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outlined"
                  onClick={printQRCode}
                >
                  Print QR Code
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendees Dialog */}
      <Dialog
        open={showAttendeesDialog}
        onClose={() => setShowAttendeesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <People sx={{ mr: 2 }} />
          {selectedEvent?.name} - Attendees ({selectedEventAttendees.length})
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingAttendees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <Box className="loading-dots" />
              <Typography sx={{ ml: 2 }}>Loading attendees...</Typography>
            </Box>
          ) : selectedEventAttendees.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              background: 'rgba(103, 126, 234, 0.05)',
              borderRadius: 3,
              m: 3,
              border: '2px dashed rgba(103, 126, 234, 0.2)'
            }}>
              <Box sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(103, 126, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <People sx={{ fontSize: 48, color: '#667eea' }} />
              </Box>
              <Typography variant="h6" sx={{ color: '#667eea', mb: 1, fontWeight: 600 }}>
                No attendees yet
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Students haven't scanned the QR code for this event yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {selectedEventAttendees.map((attendee, index) => (
                <React.Fragment key={attendee._id || index}>
                  <ListItem sx={{
                    py: 2,
                    px: 3,
                    '&:hover': {
                      background: 'rgba(103, 126, 234, 0.05)'
                    }
                  }}>
                    <Avatar sx={{
                      mr: 3,
                      background: `linear-gradient(45deg, ${
                        index % 2 === 0 ? '#667eea, #764ba2' : '#4CAF50, #8BC34A'
                      })`,
                      fontWeight: 600
                    }}>
                      {attendee.userId ? attendee.userId.substring(0, 2).toUpperCase() : 'ST'}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                          {attendee.userId || 'Unknown'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                            👤 {attendee.userName || 'No Name'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            📅 {new Date(attendee.timestamp).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ⏰ {new Date(attendee.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label="Present"
                      size="small"
                      sx={{
                        background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </ListItem>
                  {index < selectedEventAttendees.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <Box sx={{ p: 2, background: 'rgba(103, 126, 234, 0.05)', display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => setShowAttendeesDialog(false)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            Close
          </Button>
        </Box>
      </Dialog>
    </Container>
    </Box>
  );
};

export default AdminDashboard;