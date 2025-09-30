import offlineStorage from './offlineStorage';
import syncService from './syncService';
import performanceMonitor from './performanceMonitor';

class AttendanceService {
  async recordAttendance(qrData, userId, userName) {
    try {
      const attendanceRecord = {
        eventId: qrData.eventId,
        eventName: qrData.eventName,
        userId,
        userName,
        timestamp: new Date().toISOString(),
        qrTimestamp: qrData.timestamp,
        location: await this.getCurrentLocation(),
        deviceInfo: this.getDeviceInfo(),
        synced: false
      };

      const localId = await offlineStorage.saveAttendance(attendanceRecord);
      
      if (navigator.onLine) {
        try {
          await syncService.syncSingleAttendance({ ...attendanceRecord, id: localId });
          await offlineStorage.markAsSynced(localId);
        } catch (syncError) {
          console.log('Attendance saved offline, will sync when connection is restored');
          performanceMonitor.recordOfflineOperation();
        }
      } else {
        performanceMonitor.recordOfflineOperation();
      }

      return {
        success: true,
        localId,
        message: navigator.onLine ? 'Attendance recorded successfully' : 'Attendance saved offline'
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
  }

  async getAttendanceHistory(userId) {
    try {
      const localAttendance = await offlineStorage.getAllAttendance();
      const userAttendance = localAttendance.filter(record => record.userId === userId);
      
      return userAttendance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }
  }

  async getEventAttendance(eventId) {
    try {
      return await offlineStorage.getAttendanceByEvent(eventId);
    } catch (error) {
      console.error('Error fetching event attendance:', error);
      return [];
    }
  }

  async validateQRCode(qrData) {
    if (!qrData || typeof qrData !== 'object') {
      return { valid: false, error: 'Invalid QR code format' };
    }

    if (!qrData.eventId || !qrData.eventName) {
      return { valid: false, error: 'Missing required event information' };
    }

    if (qrData.type !== 'attendance') {
      return { valid: false, error: 'QR code is not for attendance tracking' };
    }

    const qrTimestamp = new Date(qrData.timestamp);
    const currentTime = new Date();
    const timeDifference = Math.abs(currentTime - qrTimestamp);
    const maxValidTime = 24 * 60 * 60 * 1000; // 24 hours

    if (timeDifference > maxValidTime) {
      return { valid: false, error: 'QR code has expired' };
    }

    return { valid: true };
  }

  async checkDuplicateAttendance(eventId, userId) {
    try {
      const eventAttendance = await offlineStorage.getAttendanceByEvent(eventId);
      return eventAttendance.some(record => record.userId === userId);
    } catch (error) {
      console.error('Error checking duplicate attendance:', error);
      return false;
    }
  }

  async getAttendanceStats(userId) {
    try {
      const userAttendance = await this.getAttendanceHistory(userId);
      const today = new Date().toDateString();
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);

      const stats = {
        total: userAttendance.length,
        today: userAttendance.filter(record => 
          new Date(record.timestamp).toDateString() === today
        ).length,
        thisWeek: userAttendance.filter(record => 
          new Date(record.timestamp) >= thisWeek
        ).length,
        thisMonth: userAttendance.filter(record => 
          new Date(record.timestamp) >= thisMonth
        ).length,
        unsynced: userAttendance.filter(record => !record.synced).length
      };

      return stats;
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        unsynced: 0
      };
    }
  }
}

export default new AttendanceService();