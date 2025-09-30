import axios from 'axios';
import offlineStorage from './offlineStorage';
import performanceMonitor from './performanceMonitor';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    // Set up axios defaults
    axios.defaults.timeout = 10000; // 10 seconds
    this.setupInterceptors();
    this.setupEventListeners();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Handle authentication error
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored, starting sync...');
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, sync paused');
    });

    // Periodic sync when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncAll();
      }
    }, 30000); // Every 30 seconds
  }

  async syncAll() {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    performanceMonitor.recordSyncStart();
    let syncedCount = 0;
    
    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      
      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeSyncQueueItem(item.id);
          syncedCount++;
        } catch (error) {
          console.error('Sync error for item:', item.id, error);
          await offlineStorage.incrementSyncAttempts(item.id);
          
          // Remove items that have failed too many times
          if (item.attempts >= this.maxRetries) {
            console.warn('Removing item after max retries:', item.id);
            await offlineStorage.removeSyncQueueItem(item.id);
          }
        }
      }

      // Sync unsynced attendance records
      const unsyncedCount = await this.syncUnsyncedAttendance();
      syncedCount += unsyncedCount;
      
      performanceMonitor.recordSyncComplete(true, syncedCount);
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
    } catch (error) {
      console.error('General sync error:', error);
      performanceMonitor.recordSyncComplete(false, syncedCount);
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncUnsyncedAttendance() {
    let syncedCount = 0;
    try {
      const unsynced = await offlineStorage.getUnsynced();
      
      for (const attendance of unsynced) {
        try {
          await this.syncSingleAttendance(attendance);
          await offlineStorage.markAsSynced(attendance.id);
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync attendance:', attendance.id, error);
        }
      }
      
      return syncedCount;
    } catch (error) {
      console.error('Error syncing unsynced attendance:', error);
      return syncedCount;
    }
  }

  async syncSingleAttendance(attendance) {
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance`, {
        eventId: attendance.eventId,
        eventName: attendance.eventName,
        userId: attendance.userId,
        userName: attendance.userName,
        timestamp: attendance.timestamp,
        qrTimestamp: attendance.qrTimestamp,
        location: attendance.location,
        deviceInfo: attendance.deviceInfo,
        localId: attendance.id
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        // Duplicate attendance - mark as synced
        console.log('Duplicate attendance detected, marking as synced');
        return { success: true, duplicate: true };
      }
      throw error;
    }
  }

  async processSyncItem(item) {
    switch (item.type) {
      case 'attendance':
        if (item.action === 'create') {
          return await this.syncSingleAttendance(item.data);
        }
        break;
      
      case 'event':
        if (item.action === 'create') {
          return await this.syncEvent(item.data);
        }
        break;
      
      default:
        console.warn('Unknown sync item type:', item.type);
    }
  }

  async syncEvent(eventData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/events`, eventData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Event already exists on server');
        return { success: true, exists: true };
      }
      throw error;
    }
  }

  async downloadEvents() {
    if (!navigator.onLine) {
      return await offlineStorage.getAllEvents();
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/events`);
      const serverEvents = response.data;

      // Save events to local storage
      for (const event of serverEvents) {
        await offlineStorage.saveEvent(event);
      }

      return serverEvents;
    } catch (error) {
      console.error('Failed to download events:', error);
      // Return local events as fallback
      return await offlineStorage.getAllEvents();
    }
  }

  async downloadAttendanceData(userId) {
    if (!navigator.onLine) {
      return await offlineStorage.getAllAttendance();
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/user/${userId}`);
      const serverAttendance = response.data;

      // Merge with local data (server data takes precedence)
      const localAttendance = await offlineStorage.getAllAttendance();
      const mergedData = this.mergeAttendanceData(localAttendance, serverAttendance);

      return mergedData;
    } catch (error) {
      console.error('Failed to download attendance data:', error);
      return await offlineStorage.getAllAttendance();
    }
  }

  mergeAttendanceData(localData, serverData) {
    const merged = [...serverData];
    const serverIds = new Set(serverData.map(item => item.localId || item.id));

    // Add local items that aren't on the server yet
    for (const localItem of localData) {
      if (!serverIds.has(localItem.id) && !localItem.synced) {
        merged.push(localItem);
      }
    }

    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async forceSyncAll() {
    this.syncInProgress = false;
    await this.syncAll();
  }

  async getSyncStatus() {
    const stats = await offlineStorage.getStorageStats();
    return {
      ...stats,
      isOnline: navigator.onLine,
      syncInProgress: this.syncInProgress,
      lastSync: localStorage.getItem('lastSyncTime')
    };
  }

  async clearSyncQueue() {
    const syncQueue = await offlineStorage.getSyncQueue();
    for (const item of syncQueue) {
      await offlineStorage.removeSyncQueueItem(item.id);
    }
  }
}

export default new SyncService();