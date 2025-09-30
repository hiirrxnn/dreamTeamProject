import { openDB } from 'idb';

const DB_NAME = 'AttendanceDB';
const DB_VERSION = 1;
const ATTENDANCE_STORE = 'attendance';
const EVENTS_STORE = 'events';
const SYNC_QUEUE_STORE = 'syncQueue';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    if (!this.db) {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
            const attendanceStore = db.createObjectStore(ATTENDANCE_STORE, {
              keyPath: 'id',
              autoIncrement: true
            });
            attendanceStore.createIndex('eventId', 'eventId');
            attendanceStore.createIndex('userId', 'userId');
            attendanceStore.createIndex('timestamp', 'timestamp');
            attendanceStore.createIndex('synced', 'synced');
          }

          if (!db.objectStoreNames.contains(EVENTS_STORE)) {
            const eventsStore = db.createObjectStore(EVENTS_STORE, {
              keyPath: 'id'
            });
            eventsStore.createIndex('name', 'name');
            eventsStore.createIndex('date', 'date');
          }

          if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
            const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, {
              keyPath: 'id',
              autoIncrement: true
            });
            syncStore.createIndex('timestamp', 'timestamp');
            syncStore.createIndex('type', 'type');
          }
        }
      });
    }
    return this.db;
  }

  async saveAttendance(attendanceData) {
    await this.init();
    const attendance = {
      ...attendanceData,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    const result = await this.db.add(ATTENDANCE_STORE, attendance);
    
    await this.addToSyncQueue({
      type: 'attendance',
      action: 'create',
      data: { ...attendance, id: result }
    });
    
    return result;
  }

  async getUnsynced() {
    await this.init();
    const allAttendance = await this.db.getAll(ATTENDANCE_STORE);
    return allAttendance.filter(record => !record.synced);
  }

  async markAsSynced(id) {
    await this.init();
    const attendance = await this.db.get(ATTENDANCE_STORE, id);
    if (attendance) {
      attendance.synced = true;
      await this.db.put(ATTENDANCE_STORE, attendance);
    }
  }

  async getAllAttendance() {
    await this.init();
    return await this.db.getAll(ATTENDANCE_STORE);
  }

  async getAttendanceByEvent(eventId) {
    await this.init();
    return await this.db.getAllFromIndex(ATTENDANCE_STORE, 'eventId', eventId);
  }

  async saveEvent(eventData) {
    await this.init();
    return await this.db.put(EVENTS_STORE, eventData);
  }

  async getAllEvents() {
    await this.init();
    return await this.db.getAll(EVENTS_STORE);
  }

  async getEvent(eventId) {
    await this.init();
    return await this.db.get(EVENTS_STORE, eventId);
  }

  async addToSyncQueue(item) {
    await this.init();
    const queueItem = {
      ...item,
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    return await this.db.add(SYNC_QUEUE_STORE, queueItem);
  }

  async getSyncQueue() {
    await this.init();
    return await this.db.getAll(SYNC_QUEUE_STORE);
  }

  async removeSyncQueueItem(id) {
    await this.init();
    return await this.db.delete(SYNC_QUEUE_STORE, id);
  }

  async incrementSyncAttempts(id) {
    await this.init();
    const item = await this.db.get(SYNC_QUEUE_STORE, id);
    if (item) {
      item.attempts += 1;
      await this.db.put(SYNC_QUEUE_STORE, item);
    }
  }

  async clearAllData() {
    await this.init();
    const tx = this.db.transaction([ATTENDANCE_STORE, EVENTS_STORE, SYNC_QUEUE_STORE], 'readwrite');
    await Promise.all([
      tx.objectStore(ATTENDANCE_STORE).clear(),
      tx.objectStore(EVENTS_STORE).clear(),
      tx.objectStore(SYNC_QUEUE_STORE).clear(),
      tx.done
    ]);
  }

  async getStorageStats() {
    await this.init();
    const [attendance, events, syncQueue] = await Promise.all([
      this.db.count(ATTENDANCE_STORE),
      this.db.count(EVENTS_STORE),
      this.db.count(SYNC_QUEUE_STORE)
    ]);

    // Count unsynced records manually since boolean index queries can be problematic
    const allAttendance = await this.db.getAll(ATTENDANCE_STORE);
    const unsynced = allAttendance.filter(record => !record.synced).length;

    return {
      totalAttendance: attendance,
      totalEvents: events,
      pendingSync: syncQueue,
      unsyncedAttendance: unsynced
    };
  }
}

export default new OfflineStorage();