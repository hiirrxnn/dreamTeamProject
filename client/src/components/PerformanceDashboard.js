import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Speed,
  Security,
  Cloud,
  Analytics,
  Download,
  Refresh,
  ExpandMore,
  TrendingUp,
  NetworkCheck,
  Sync
} from '@mui/icons-material';
import performanceMonitor from '../services/performanceMonitor';

const PerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadPerformanceData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = () => {
    const data = performanceMonitor.generateReport();
    setPerformanceData(data);
    setLoading(false);
  };

  const exportReport = () => {
    performanceMonitor.exportReport();
  };

  const resetMetrics = () => {
    performanceMonitor.reset();
    loadPerformanceData();
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getGradeColor = (grade) => {
    const colors = { A: 'success', B: 'info', C: 'warning', D: 'error' };
    return colors[grade] || 'default';
  };

  if (loading || !performanceData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ textAlign: 'center', mt: 2 }}>
          Loading performance metrics...
        </Typography>
      </Container>
    );
  }

  const { qos, performance } = performanceData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          📊 Performance & QoS Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={loadPerformanceData}>
            Refresh
          </Button>
          <Button startIcon={<Download />} onClick={exportReport} variant="outlined">
            Export Report
          </Button>
          <Button onClick={resetMetrics} color="secondary">
            Reset
          </Button>
        </Box>
      </Box>

      {/* QoS Overview */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1 }} />
          Quality of Service (QoS) Metrics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Speed color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color={getScoreColor(qos.reliability.score)}>
                  {qos.reliability.score}%
                </Typography>
                <Typography variant="body2">Reliability Score</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <NetworkCheck color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4">
                  {qos.latency.avg}ms
                </Typography>
                <Typography variant="body2">Avg Latency</Typography>
                <Typography variant="caption" color="text.secondary">
                  P95: {qos.latency.p95}ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Analytics color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Chip 
                  label={`Grade ${qos.scalability.performanceGrade}`}
                  color={getGradeColor(qos.scalability.performanceGrade)}
                  size="large"
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Performance Grade
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max Users: {qos.scalability.recommendedMaxUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Cloud color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {qos.availability.offlineCapable ? '✓' : '✗'}
                </Typography>
                <Typography variant="body2">Offline Capable</Typography>
                <Typography variant="caption" color="text.secondary">
                  Sync: {performance.sync.avgDuration}ms avg
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Metrics */}
      <Grid container spacing={3}>
        {/* Latency Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🚀 Latency Analysis
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Network Request Performance
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((200 / (qos.latency.avg || 1)) * 100, 100)}
                color={qos.latency.avg < 200 ? 'success' : qos.latency.avg < 500 ? 'warning' : 'error'}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Minimum Latency</TableCell>
                    <TableCell>{qos.latency.min}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maximum Latency</TableCell>
                    <TableCell>{qos.latency.max}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>95th Percentile</TableCell>
                    <TableCell>{qos.latency.p95}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Requests</TableCell>
                    <TableCell>{qos.latency.count}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Sync Performance */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Sync sx={{ mr: 1, verticalAlign: 'middle' }} />
              Synchronization Metrics
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sync Success Rate: {performance.sync.successRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={performance.sync.successRate}
                color={performance.sync.successRate > 95 ? 'success' : 'warning'}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Avg Sync Time</TableCell>
                    <TableCell>{performance.sync.avgDuration}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Max Sync Time</TableCell>
                    <TableCell>{performance.sync.maxDuration}ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Records Synced</TableCell>
                    <TableCell>{performance.sync.totalRecords}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sync Operations</TableCell>
                    <TableCell>{performance.sync.count}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Network Stats */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🌐 Network Statistics
            </Typography>
            
            <Alert 
              severity={performance.network.failureRate < 5 ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              Network Failure Rate: {performance.network.failureRate}%
            </Alert>

            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total Requests</TableCell>
                    <TableCell>{performance.network.totalRequests}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failed Requests</TableCell>
                    <TableCell>{performance.network.failures}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Offline Operations</TableCell>
                    <TableCell>{performance.network.offlineOperations}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Security & Reliability */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security & Reliability
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Data Integrity</Typography>
                <Chip 
                  label={performanceData.security.dataIntegrity ? 'Secure' : 'At Risk'} 
                  color={performanceData.security.dataIntegrity ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Offline Data Protection</Typography>
                <Chip 
                  label={performanceData.security.offlineDataProtection ? 'Protected' : 'Vulnerable'} 
                  color={performanceData.security.offlineDataProtection ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">System Reliability</Typography>
                <Chip 
                  label={`${qos.reliability.score}%`}
                  color={getScoreColor(qos.reliability.score)}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Advanced Metrics */}
      <Paper elevation={2} sx={{ mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              🔬 Advanced Performance Metrics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Scalability Analysis
                </Typography>
                <Typography variant="body2">
                  Recommended Max Users: {qos.scalability.recommendedMaxUsers}
                </Typography>
                <Typography variant="body2">
                  Sync Efficiency: {qos.scalability.syncEfficiency} rec/sec
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Page Load Performance
                </Typography>
                {performance.pageLoad && (
                  <>
                    <Typography variant="body2">
                      DOM Content Loaded: {Math.round(performance.pageLoad.domContentLoaded)}ms
                    </Typography>
                    <Typography variant="body2">
                      Total Load Time: {Math.round(performance.pageLoad.totalTime)}ms
                    </Typography>
                  </>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  System Health
                </Typography>
                <Typography variant="body2">
                  Last Updated: {new Date(performanceData.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2">
                  Status: {qos.reliability.score > 80 ? 'Healthy' : 'Needs Attention'}
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Container>
  );
};

export default PerformanceDashboard;