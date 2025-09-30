# QR Code Attendance Tracker

A full-stack application for tracking attendance using QR codes with offline support. The application works seamlessly both online and offline, automatically syncing data when connectivity is restored.

## Features

### Core Functionality
- **QR Code Generation & Scanning**: Generate unique QR codes for events and scan them to record attendance
- **Offline-First Architecture**: Full functionality even without internet connection
- **Automatic Synchronization**: Data syncs automatically when connectivity is restored
- **Real-time Network Status**: Visual indicators for connection status and sync state
- **Attendance History**: Complete history with sync status indicators
- **Event Management**: Create and manage events with capacity limits

### Technical Features
- **PWA Support**: Progressive Web App capabilities for mobile experience
- **IndexedDB Storage**: Local data persistence using IndexedDB
- **Background Sync**: Automatic data synchronization using service workers
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Material-UI Components**: Modern, accessible user interface

## Tech Stack

### Frontend
- **React** 18 - UI framework
- **Material-UI** - Component library
- **IndexedDB** - Local storage via `idb` library
- **QR Code Libraries**: `qrcode` for generation, `jsQR` for scanning
- **Axios** - HTTP client with offline handling

### Backend
- **Node.js** with Express - REST API server
- **MongoDB** with Mongoose - Database and ODM
- **CORS** - Cross-origin resource sharing
- **Environment Configuration** - dotenv support

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Modern web browser with camera access

### Setup

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd qr-attendance-tracker
npm run install-all
```

2. **Configure environment**:
```bash
# Server configuration
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

3. **Start the application**:
```bash
# Development mode (runs both client and server)
npm start

# Or run separately:
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm start
```

4. **Access the application**:
- Client: http://localhost:3000
- Server API: http://localhost:3001
- Health check: http://localhost:3001/api/health

## Usage

### For Users
1. **Setup**: Enter your User ID and name when first opening the app
2. **Scan QR**: Tap "Scan QR Code" and point camera at event QR code
3. **Attendance**: Attendance is recorded instantly, even offline
4. **History**: View your attendance history with sync status
5. **Sync**: Data syncs automatically when online

### For Event Organizers
1. **Create Events**: Use the API to create events with unique IDs
2. **Generate QR Codes**: Get QR code data from `/api/events/:eventId/qr`
3. **Monitor Attendance**: View real-time attendance via API endpoints
4. **Export Data**: Download attendance reports and statistics

## API Endpoints

### Attendance
- `POST /api/attendance` - Record attendance
- `GET /api/attendance/user/:userId` - Get user attendance history
- `GET /api/attendance/event/:eventId` - Get event attendance
- `GET /api/attendance/user/:userId/stats` - Get attendance statistics
- `POST /api/attendance/bulk` - Bulk create attendance records

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:eventId` - Get specific event
- `PUT /api/events/:eventId` - Update event
- `DELETE /api/events/:eventId` - Deactivate event
- `GET /api/events/:eventId/qr` - Get QR code data

### Users
- `GET /api/users` - List users with stats
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/:userId/summary` - Get attendance summary
- `GET /api/users/stats/leaderboard` - Get attendance leaderboard

## Offline Functionality

### Data Storage
- **Attendance Records**: Stored locally with sync status
- **Events Cache**: Events cached for offline access
- **Sync Queue**: Failed syncs queued for retry
- **User Preferences**: Settings persist across sessions

### Sync Strategy
- **Automatic Sync**: Runs every 30 seconds when online
- **Connection Detection**: Monitors online/offline state
- **Retry Logic**: Failed syncs retry with exponential backoff
- **Conflict Resolution**: Server data takes precedence

### Network Indicators
- **Connection Status**: Online/offline indicator with signal strength
- **Sync Status**: Shows pending/unsynced record counts
- **Data Freshness**: Visual indicators for local vs synced data

## Architecture

### Client Architecture
```
src/
├── components/          # React components
│   ├── AttendanceTracker.js    # Main app component
│   ├── QRScanner.js            # Camera QR scanner
│   ├── NetworkStatus.js        # Connection indicator
│   └── AttendanceHistory.js    # History display
├── services/           # Business logic
│   ├── attendanceService.js    # Attendance operations
│   ├── offlineStorage.js       # IndexedDB wrapper
│   └── syncService.js          # Sync operations
├── hooks/              # Custom React hooks
│   └── useNetworkStatus.js     # Network monitoring
└── utils/              # Utilities
    └── qrCodeGenerator.js      # QR generation
```

### Server Architecture
```
server/
├── models/             # Mongoose schemas
│   ├── Attendance.js           # Attendance model
│   └── Event.js                # Event model
├── routes/             # Express routes
│   ├── attendance.js           # Attendance endpoints
│   ├── events.js               # Event endpoints
│   └── users.js                # User endpoints
└── index.js            # Server entry point
```

## Development

### Running Tests
```bash
# Client tests
cd client && npm test

# Server tests (add test framework as needed)
cd server && npm test
```

### Building for Production
```bash
# Build client
cd client && npm run build

# Deploy server
cd server && npm start
```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `REACT_APP_API_URL`: Client API URL

## Deployment

### Client (Static Hosting)
- Build: `npm run build`
- Deploy `client/build/` folder to static hosting service
- Configure API URL environment variable

### Server (Node.js Hosting)
- Deploy `server/` folder to Node.js hosting service
- Configure environment variables
- Ensure MongoDB accessibility

### Database
- Use MongoDB Atlas for cloud deployment
- Configure connection string in environment variables
- Set up proper indexes for performance

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the GitHub repository or contact the development team.