const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all active events
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, active, upcoming, current } = req.query;

    let query = {};
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    let events;
    
    if (upcoming === 'true') {
      events = await Event.findUpcoming()
        .limit(parseInt(limit))
        .skip(parseInt(offset));
    } else if (current === 'true') {
      events = await Event.findCurrent()
        .limit(parseInt(limit))
        .skip(parseInt(offset));
    } else {
      events = await Event.find(query)
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));
    }

    const totalCount = await Event.countDocuments(query);

    res.json({
      events,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Get single event by ID
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOne({ id: eventId });
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    res.json(event);

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      date,
      startTime,
      endTime,
      location,
      organizer,
      capacity
    } = req.body;

    // Validate required fields
    if (!id || !name || !date || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, date, startTime, endTime'
      });
    }

    // Check if event with same ID already exists
    const existingEvent = await Event.findOne({ id });
    if (existingEvent) {
      return res.status(409).json({
        error: 'Event with this ID already exists',
        event: existingEvent
      });
    }

    // Validate dates
    const eventDate = new Date(date);
    const eventStartTime = new Date(startTime);
    const eventEndTime = new Date(endTime);

    if (eventStartTime >= eventEndTime) {
      return res.status(400).json({
        error: 'Start time must be before end time'
      });
    }

    const event = new Event({
      id,
      name,
      description,
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location,
      organizer,
      capacity: capacity ? parseInt(capacity) : null
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// Update event
router.put('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.attendanceCount;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Validate dates if provided
    if (updateData.startTime && updateData.endTime) {
      const startTime = new Date(updateData.startTime);
      const endTime = new Date(updateData.endTime);
      
      if (startTime >= endTime) {
        return res.status(400).json({
          error: 'Start time must be before end time'
        });
      }
    }

    const event = await Event.findOneAndUpdate(
      { id: eventId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// Delete event (soft delete - set inactive)
router.delete('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOneAndUpdate(
      { id: eventId },
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deactivated successfully',
      event
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// Get events by date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const { active = true } = req.query;

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (active !== 'all') {
      query.isActive = active === 'true';
    }

    const events = await Event.find(query).sort({ date: 1 });

    res.json(events);

  } catch (error) {
    console.error('Error fetching events by date range:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Get QR code data for an event
router.get('/:eventId/qr', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findOne({ id: eventId, isActive: true });
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found or inactive'
      });
    }

    const qrData = {
      eventId: event.id,
      eventName: event.name,
      timestamp: new Date().toISOString(),
      type: 'attendance'
    };

    res.json({
      qrData,
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location
      }
    });

  } catch (error) {
    console.error('Error fetching event QR data:', error);
    res.status(500).json({
      error: 'Failed to fetch QR data',
      message: error.message
    });
  }
});

module.exports = router;