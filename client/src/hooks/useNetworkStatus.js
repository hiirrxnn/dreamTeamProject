import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState('unknown');
  const [connectionSpeed, setConnectionSpeed] = useState('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          setNetworkType(connection.effectiveType || 'unknown');
          setConnectionSpeed(connection.downlink || 'unknown');
        }
      }
    };

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Update network info initially and on connection change
    updateNetworkInfo();
    
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', updateNetworkInfo);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', updateNetworkInfo);
        }
      }
    };
  }, []);

  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    
    if (networkType === '4g' || networkType === '5g') return 'excellent';
    if (networkType === '3g') return 'good';
    if (networkType === '2g') return 'poor';
    if (networkType === 'slow-2g') return 'very-poor';
    
    return 'unknown';
  };

  return {
    isOnline,
    networkType,
    connectionSpeed,
    connectionQuality: getConnectionQuality()
  };
};