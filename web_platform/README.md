# Vehicle Data Monitoring System

A real-time web application for uploading and fetching vehicle data, including speed information, license plate recognition, and helmet detection.

## Features

- Real-time data updates using Socket.IO
- Upload and view vehicle data (speed, license plates, helmet detection)
- Upload and view vehicle and license plate images
- Dashboard with combined vehicle data view
- Responsive UI using React and Bootstrap

## Project Structure

```
project/
├── server.js                   # Express server with API endpoints
├── package.json                # Server dependencies
├── vehicle_data_with_helmet/   # Data directory (existing)
│   ├── all_vehicle_detected_img/  # Vehicle images
│   ├── all_license_plate_img/     # License plate images
│   ├── speed_data.json            # Speed data
│   ├── new_license_data.json      # License plate data
│   └── helmet_data.json           # Helmet detection data
│
└── client/                     # React frontend
    ├── public/                 # Public assets
    └── src/                    # React source code
        ├── components/         # React components
        │   ├── VehicleDataDisplay.js
        │   ├── ImageGallery.js
        │   └── UploadForm.js
        ├── App.js              # Main App component
        ├── index.js            # Entry point
        └── index.css           # Global styles
```

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone the repository
2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

## Running the Application

### Development Mode

1. Start the server:
   ```
   npm run dev
   ```

2. In a separate terminal, start the React client:
   ```
   npm run client
   ```

3. Open a browser and navigate to [http://localhost:3000](http://localhost:3000)

### Production Mode

1. Build the React application:
   ```
   cd client
   npm run build
   cd ..
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open a browser and navigate to [http://localhost:5000](http://localhost:5000)

## API Endpoints

- `GET /api/data` - Get all vehicle data and image paths
- `POST /api/upload/data` - Upload vehicle data (speed, license, helmet)
- `POST /api/upload/images` - Upload vehicle and license plate images
- `/api/images/vehicles/:filename` - Get vehicle image
- `/api/images/licenses/:filename` - Get license plate image

## Real-time Updates

The application uses Socket.IO for real-time updates:

- Data changes are broadcast to all connected clients
- Image uploads are broadcast to all connected clients
- New files detected in the watched directories are broadcast to all clients

## License

MIT 