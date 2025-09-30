# Testing Instructions

## Quick Start

1. **Install dependencies**:
```bash
npm run install-all
```

2. **Start MongoDB** (if using local instance):
```bash
# Using MongoDB Community Edition
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

3. **Configure server environment**:
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI if different from default
```

4. **Start the application**:
```bash
# From root directory - runs both client and server
npm start
```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Testing Offline Functionality

### Setup Test Environment

1. **Create test event**:
```bash
# Use this curl command to create a test event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-event-1",
    "name": "Test Meeting",
    "description": "Test event for QR attendance",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T17:00:00.000Z",
    "location": {
      "name": "Conference Room A",
      "address": "123 Main St"
    },
    "organizer": {
      "id": "admin",
      "name": "Event Admin"
    }
  }'
```

2. **Get QR code data**:
```bash
curl http://localhost:3001/api/events/test-event-1/qr
```

### Testing Steps

#### Test 1: Online Attendance Recording
1. Open http://localhost:3000
2. Enter user details (e.g., ID: "user123", Name: "John Doe")
3. Click "Scan QR Code"
4. Create a QR code with this data:
```json
{
  "eventId": "test-event-1",
  "eventName": "Test Meeting",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "type": "attendance"
}
```
5. Scan the QR code
6. Verify attendance is recorded and shows "synced" status

#### Test 2: Offline Functionality
1. Open Developer Tools → Network tab
2. Select "Offline" to simulate no connection
3. Try scanning the same QR code with a different user ID
4. Verify attendance is saved locally with "offline" status
5. Check Application tab → IndexedDB → AttendanceDB to see stored data

#### Test 3: Sync Restoration
1. Return to "Online" mode in Developer Tools
2. Wait for automatic sync (30 seconds) or click "Sync Now"
3. Verify offline records now show "synced" status
4. Check server database to confirm data was synced

#### Test 4: Poor Connection Simulation
1. Use Developer Tools → Network tab → Slow 3G
2. Record attendance and observe sync behavior
3. Test with network interruptions

### Manual QR Code Testing

If you can't generate QR codes, use these test JSON strings:

**Event 1**:
```json
{"eventId":"test-event-1","eventName":"Test Meeting","timestamp":"2024-01-15T10:00:00.000Z","type":"attendance"}
```

**Event 2**:
```json
{"eventId":"test-event-2","eventName":"Workshop","timestamp":"2024-01-15T14:00:00.000Z","type":"attendance"}
```

You can paste these directly into the QR scanner if it has a text input fallback.

### API Testing

Test the backend APIs directly:

```bash
# Create event
curl -X POST http://localhost:3001/api/events -H "Content-Type: application/json" -d '{"id":"event1","name":"Test Event","date":"2024-01-15","startTime":"2024-01-15T09:00:00Z","endTime":"2024-01-15T17:00:00Z"}'

# Record attendance
curl -X POST http://localhost:3001/api/attendance -H "Content-Type: application/json" -d '{"eventId":"event1","eventName":"Test Event","userId":"user1","userName":"Test User"}'

# Get user attendance
curl http://localhost:3001/api/attendance/user/user1

# Get user stats
curl http://localhost:3001/api/attendance/user/user1/stats
```

### Troubleshooting

**MongoDB Connection Issues**:
- Ensure MongoDB is running on port 27017
- Check the MONGODB_URI in server/.env
- Verify firewall/network settings

**Camera Access Issues**:
- Use HTTPS for production (required for camera access)
- For local testing, use localhost (allowed for camera access)
- Check browser permissions for camera access

**Sync Issues**:
- Check browser console for errors
- Verify backend API is accessible
- Check IndexedDB storage in Developer Tools

**Performance Testing**:
- Test with large datasets (1000+ attendance records)
- Test sync with slow network conditions
- Monitor memory usage during extended offline periods

### Expected Results

- ✅ Attendance records offline and online
- ✅ Data persists across browser refreshes
- ✅ Automatic sync when connection restored
- ✅ Network status indicators work correctly
- ✅ No data loss during network interruptions
- ✅ Duplicate prevention works offline and online