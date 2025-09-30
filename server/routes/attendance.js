const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');

// Create attendance record
router.post('/', async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      userId,
      userName,
      timestamp,
      qrTimestamp,
      location,
      deviceInfo,
      localId
    } = req.body;

    // Validate required fields
    if (!eventId || !userId || !userName) {
      return res.status(400).json({
        error: 'Missing required fields: eventId, userId, userName'
      });
    }

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({ eventId, userId });
    if (existingAttendance) {
      return res.status(409).json({
        error: 'Attendance already recorded for this event',
        attendance: existingAttendance
      });
    }

    // Verify event exists and is active
    const event = await Event.findOne({ id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        error: 'Event not found or inactive'
      });
    }

    // Check if event has capacity
    if (!event.hasCapacity()) {
      return res.status(400).json({
        error: 'Event has reached maximum capacity'
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      eventId,
      eventName: eventName || event.name,
      userId,
      userName,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      qrTimestamp: qrTimestamp ? new Date(qrTimestamp) : new Date(),
      location,
      deviceInfo,
      localId
    });

    await attendance.save();

    // Update event attendance count
    await Event.findOneAndUpdate(
      { id: eventId },
      { $inc: { attendanceCount: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance
    });

  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({
      error: 'Failed to record attendance',
      message: error.message
    });
  }
});

// Get attendance records for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, startDate, endDate } = req.query;

    let query = { userId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Attendance.countDocuments(query);

    res.json({
      attendance,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    console.error('Error fetching user attendance:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance records',
      message: error.message
    });
  }
});

// Get attendance records for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const attendance = await Attendance.find({ eventId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await Attendance.countDocuments({ eventId });

    res.json({
      attendance,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    console.error('Error fetching event attendance:', error);
    res.status(500).json({
      error: 'Failed to fetch event attendance',
      message: error.message
    });
  }
});

// Get attendance statistics for a user
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await Attendance.getAttendanceStats(userId);
    
    res.json(stats);

  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance statistics',
      message: error.message
    });
  }
});

// Get attendance by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate, userId, eventId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    let query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) query.userId = userId;
    if (eventId) query.eventId = eventId;

    const attendance = await Attendance.find(query)
      .sort({ timestamp: -1 });

    res.json(attendance);

  } catch (error) {
    console.error('Error fetching attendance by date range:', error);
    res.status(500).json({
      error: 'Failed to fetch attendance records',
      message: error.message
    });
  }
});

// Bulk create attendance records (for sync)
router.post('/bulk', async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords)) {
      return res.status(400).json({
        error: 'attendanceRecords must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const existingAttendance = await Attendance.findOne({
          eventId: record.eventId,
          userId: record.userId
        });

        if (existingAttendance) {
          results.push({
            localId: record.localId,
            status: 'duplicate',
            attendance: existingAttendance
          });
          continue;
        }

        const attendance = new Attendance({
          ...record,
          timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
          qrTimestamp: record.qrTimestamp ? new Date(record.qrTimestamp) : new Date()
        });

        await attendance.save();

        // Update event attendance count
        await Event.findOneAndUpdate(
          { id: record.eventId },
          { $inc: { attendanceCount: 1 } }
        );

        results.push({
          localId: record.localId,
          status: 'created',
          attendance
        });

      } catch (error) {
        errors.push({
          localId: record.localId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      processed: attendanceRecords.length,
      created: results.filter(r => r.status === 'created').length,
      duplicates: results.filter(r => r.status === 'duplicate').length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk attendance creation:', error);
    res.status(500).json({
      error: 'Failed to process bulk attendance records',
      message: error.message
    });
  }
});

module.exports = router;