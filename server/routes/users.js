const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Get user profile with attendance summary
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get attendance statistics
    const stats = await Attendance.getAttendanceStats(userId);
    
    // Get recent attendance
    const recentAttendance = await Attendance.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5);

    // Get first attendance date
    const firstAttendance = await Attendance.findOne({ userId })
      .sort({ timestamp: 1 });

    const profile = {
      userId,
      stats,
      recentAttendance,
      memberSince: firstAttendance ? firstAttendance.timestamp : null,
      lastActivity: recentAttendance.length > 0 ? recentAttendance[0].timestamp : null
    };

    res.json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

// Get all users with attendance counts
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Aggregate users from attendance records
    const users = await Attendance.aggregate([
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          totalAttendance: { $sum: 1 },
          lastAttendance: { $max: '$timestamp' },
          firstAttendance: { $min: '$timestamp' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          totalAttendance: 1,
          lastAttendance: 1,
          firstAttendance: 1,
          _id: 0
        }
      },
      {
        $sort: { totalAttendance: -1 }
      },
      {
        $skip: parseInt(offset)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get total count of unique users
    const totalCountResult = await Attendance.aggregate([
      {
        $group: {
          _id: '$userId'
        }
      },
      {
        $count: 'totalUsers'
      }
    ]);

    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].totalUsers : 0;

    res.json({
      users,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// Get user attendance summary by date range
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let matchStage = { userId };

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    let groupStage;
    
    switch (groupBy) {
      case 'week':
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              week: { $week: '$timestamp' }
            },
            count: { $sum: 1 },
            events: { $push: { eventId: '$eventId', eventName: '$eventName', timestamp: '$timestamp' } }
          }
        };
        break;
      case 'month':
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' }
            },
            count: { $sum: 1 },
            events: { $push: { eventId: '$eventId', eventName: '$eventName', timestamp: '$timestamp' } }
          }
        };
        break;
      default: // day
        groupStage = {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            count: { $sum: 1 },
            events: { $push: { eventId: '$eventId', eventName: '$eventName', timestamp: '$timestamp' } }
          }
        };
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      groupStage,
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching user summary:', error);
    res.status(500).json({
      error: 'Failed to fetch user summary',
      message: error.message
    });
  }
});

// Get leaderboard (top users by attendance)
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;

    let matchStage = {};

    // Add period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (startDate) {
        matchStage.timestamp = { $gte: startDate };
      }
    }

    const leaderboard = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          attendanceCount: { $sum: 1 },
          uniqueEvents: { $addToSet: '$eventId' },
          lastAttendance: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          attendanceCount: 1,
          uniqueEventsCount: { $size: '$uniqueEvents' },
          lastAttendance: 1,
          _id: 0
        }
      },
      {
        $sort: { attendanceCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

module.exports = router;