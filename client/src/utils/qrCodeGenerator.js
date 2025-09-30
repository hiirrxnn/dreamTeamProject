import QRCode from 'qrcode';

export const generateQRCode = async (data) => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const generateAttendanceQR = async (eventId, eventName, timestamp) => {
  const qrData = {
    eventId,
    eventName,
    timestamp: timestamp || new Date().toISOString(),
    type: 'attendance'
  };
  
  return await generateQRCode(JSON.stringify(qrData));
};