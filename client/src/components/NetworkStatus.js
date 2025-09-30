import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import {
  Wifi,
  WifiOff,
  SignalCellular1Bar,
  SignalCellular2Bar,
  SignalCellular3Bar,
  SignalCellular4Bar
} from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatus = () => {
  const { isOnline, networkType, connectionQuality, connectionSpeed } = useNetworkStatus();

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff />;
    
    switch (connectionQuality) {
      case 'excellent':
        return <SignalCellular4Bar />;
      case 'good':
        return <SignalCellular3Bar />;
      case 'poor':
        return <SignalCellular2Bar />;
      case 'very-poor':
        return <SignalCellular1Bar />;
      default:
        return <Wifi />;
    }
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'error';
    
    switch (connectionQuality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'primary';
      case 'poor':
        return 'warning';
      case 'very-poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    const parts = [];
    if (networkType !== 'unknown') parts.push(networkType.toUpperCase());
    if (connectionSpeed !== 'unknown') parts.push(`${connectionSpeed} Mbps`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Online';
  };

  const getTooltipText = () => {
    const details = [
      `Status: ${isOnline ? 'Online' : 'Offline'}`,
      `Quality: ${connectionQuality}`,
    ];
    
    if (networkType !== 'unknown') details.push(`Type: ${networkType}`);
    if (connectionSpeed !== 'unknown') details.push(`Speed: ${connectionSpeed} Mbps`);
    
    return details.join('\n');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Tooltip title={getTooltipText()} arrow>
        <Chip
          icon={getConnectionIcon()}
          label={getStatusText()}
          color={getConnectionColor()}
          variant={isOnline ? 'filled' : 'outlined'}
          size="small"
        />
      </Tooltip>
    </Box>
  );
};

export default NetworkStatus;