const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  qrTimestamp: {
    type: Date,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    timestamp: Date
  },
  localId: {
    type: String,
    index: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Index for querying by date range
attendanceSchema.index({ timestamp: -1 });

// Methods
attendanceSchema.methods.toJSON = function() {
  const attendance = this.toObject();
  return {
    id: attendance._id,
    eventId: attendance.eventId,
    eventName: attendance.eventName,
    userId: attendance.userId,
    userName: attendance.userName,
    timestamp: attendance.timestamp,
    qrTimestamp: attendance.qrTimestamp,
    location: attendance.location,
    deviceInfo: attendance.deviceInfo,
    localId: attendance.localId,
    syncedAt: attendance.syncedAt,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt
  };
};

// Static methods
attendanceSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ timestamp: -1 });
};

attendanceSchema.statics.findByEvent = function(eventId) {
  return this.find({ eventId }).sort({ timestamp: -1 });
};

attendanceSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

attendanceSchema.statics.getAttendanceStats = function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  
  const thisMonth = new Date();
  thisMonth.setMonth(thisMonth.getMonth() - 1);
  
  return Promise.all([
    this.countDocuments({ userId }),
    this.countDocuments({ userId, timestamp: { $gte: today } }),
    this.countDocuments({ userId, timestamp: { $gte: thisWeek } }),
    this.countDocuments({ userId, timestamp: { $gte: thisMonth } })
  ]).then(([total, todayCount, weekCount, monthCount]) => ({
    total,
    today: todayCount,
    thisWeek: weekCount,
    thisMonth: monthCount
  }));
};

module.exports = mongoose.model('Attendance', attendanceSchema);