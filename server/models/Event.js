const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  organizer: {
    id: String,
    name: String,
    email: String
  },
  capacity: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  qrCodeData: {
    type: Object,
    default: null
  },
  attendanceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ date: -1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ 'organizer.id': 1 });

// Virtual for attendance
eventSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: 'id',
  foreignField: 'eventId'
});

// Methods
eventSchema.methods.toJSON = function() {
  const event = this.toObject();
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    organizer: event.organizer,
    capacity: event.capacity,
    isActive: event.isActive,
    attendanceCount: event.attendanceCount,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt
  };
};

eventSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
};

eventSchema.methods.hasCapacity = function() {
  return this.capacity === null || this.attendanceCount < this.capacity;
};

// Static methods
eventSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ date: 1 });
};

eventSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

eventSchema.statics.findUpcoming = function() {
  return this.find({
    isActive: true,
    startTime: { $gte: new Date() }
  }).sort({ startTime: 1 });
};

eventSchema.statics.findCurrent = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now }
  }).sort({ startTime: 1 });
};

// Middleware to update attendance count
eventSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCodeData) {
    this.qrCodeData = {
      eventId: this.id,
      eventName: this.name,
      timestamp: this.createdAt || new Date(),
      type: 'attendance'
    };
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);