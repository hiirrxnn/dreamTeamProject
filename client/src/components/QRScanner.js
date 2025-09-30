import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button, Box, Typography, Alert } from '@mui/material';

const QRScanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  const startCamera = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser. Please use HTTPS or enable insecure origins.');
      }
      
      // Try different camera configurations for mobile compatibility
      let stream;
      try {
        // First try with rear camera and ideal settings
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (err) {
        // Fallback: try with basic video constraints
        console.warn('Rear camera failed, trying basic video:', err);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMessage = 'Camera access failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported. Please use HTTPS (try ngrok) or enable insecure origins in Chrome.';
      } else if (err.message.includes('not supported') || err.message.includes('HTTPS')) {
        errorMessage += 'Camera requires HTTPS. Please use secure connection or enable insecure origins.';
      } else {
        errorMessage += 'Please check permissions and connection security (HTTPS required).';
      }
      
      setError(errorMessage);
      onError?.(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        try {
          const qrData = JSON.parse(code.data);
          onScan(qrData);
          setIsScanning(false);
        } catch (err) {
          onScan({ raw: code.data });
        }
      }
    }
    
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    if (isScanning && hasPermission) {
      scanFrame();
    }
  }, [isScanning, hasPermission]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        QR Code Scanner
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '8px',
            display: isScanning ? 'block' : 'none'
          }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        
        {isScanning && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #fff',
              borderRadius: '8px',
              width: '60%',
              height: '60%',
              pointerEvents: 'none'
            }}
          />
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        {!isScanning ? (
          <Button 
            variant="contained" 
            onClick={startCamera}
            size="large"
          >
            Start Scanning
          </Button>
        ) : (
          <Button 
            variant="outlined" 
            onClick={stopCamera}
            size="large"
          >
            Stop Scanning
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default QRScanner;