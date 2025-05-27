const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    let destination = '';
    if (file.fieldname === 'vehicle') {
      destination = 'vehicle_data_with_helmet/all_vehicle_detected_img';
    } else if (file.fieldname === 'license') {
      destination = 'vehicle_data_with_helmet/all_license_plate_img';
    }
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    const fileId = Date.now();
    if (file.fieldname === 'vehicle') {
      cb(null, `car_${fileId}.jpg`);
    } else if (file.fieldname === 'license') {
      cb(null, `license_plate_${fileId}.jpg`);
    }
  }
});

const upload = multer({ storage: storage });

// Data paths
const speedDataPath = path.join(__dirname, 'vehicle_data_with_helmet/speed_data.json');
const licenseDataPath = path.join(__dirname, 'vehicle_data_with_helmet/new_license_data.json');
const helmetDataPath = path.join(__dirname, 'vehicle_data_with_helmet/helmet_data.json');
const vehicleImagesPath = path.join(__dirname, 'vehicle_data_with_helmet/all_vehicle_detected_img');
const licensePlateImagesPath = path.join(__dirname, 'vehicle_data_with_helmet/all_license_plate_img');

// Helper function to read JSON safely
const readJsonFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim() === '') {
        return {};
      }
      return JSON.parse(content);
    }
    return {};
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return {};
  }
};

// Helper function to write JSON safely
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// API routes
app.get('/api/data', (req, res) => {
  const speedData = readJsonFile(speedDataPath);
  const licenseData = readJsonFile(licenseDataPath);
  const helmetData = readJsonFile(helmetDataPath);
  
  // Get image file names
  let vehicleImages = [];
  let licensePlateImages = [];
  
  try {
    vehicleImages = fs.readdirSync(vehicleImagesPath)
      .filter(file => file.startsWith('car_') && file.endsWith('.jpg'))
      .map(file => `/api/images/vehicles/${file}`);
    
    licensePlateImages = fs.readdirSync(licensePlateImagesPath)
      .filter(file => file.startsWith('license_plate_') && file.endsWith('.jpg'))
      .map(file => `/api/images/licenses/${file}`);
  } catch (error) {
    console.error('Error reading image directories:', error);
  }
  
  res.json({
    speedData,
    licenseData,
    helmetData,
    vehicleImages,
    licensePlateImages
  });
});

// Serve images
app.use('/api/images/vehicles', express.static(vehicleImagesPath));
app.use('/api/images/licenses', express.static(licensePlateImagesPath));

// Upload endpoints
app.post('/api/upload/data', (req, res) => {
  const { type, data } = req.body;
  
  let filePath;
  let currentData;
  
  if (type === 'speed') {
    filePath = speedDataPath;
    currentData = readJsonFile(speedDataPath);
  } else if (type === 'license') {
    filePath = licenseDataPath;
    currentData = readJsonFile(licenseDataPath);
  } else if (type === 'helmet') {
    filePath = helmetDataPath;
    currentData = readJsonFile(helmetDataPath);
  } else {
    return res.status(400).json({ error: 'Invalid data type' });
  }
  
  // Merge new data with existing data
  const updatedData = { ...currentData, ...data };
  
  // Write updated data
  if (writeJsonFile(filePath, updatedData)) {
    io.emit('data-update', { type, data: updatedData });
    res.json({ success: true, data: updatedData });
  } else {
    res.status(500).json({ error: 'Failed to write data' });
  }
});

// Upload images
app.post('/api/upload/images', upload.fields([
  { name: 'vehicle', maxCount: 5 },
  { name: 'license', maxCount: 5 }
]), (req, res) => {
  try {
    const uploadedFiles = {
      vehicles: req.files.vehicle ? req.files.vehicle.map(file => `/api/images/vehicles/${file.filename}`) : [],
      licenses: req.files.license ? req.files.license.map(file => `/api/images/licenses/${file.filename}`) : []
    };
    
    io.emit('image-upload', uploadedFiles);
    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Set up file watchers for real-time updates
const setupWatchers = () => {
  // Watch JSON files
  const jsonWatcher = chokidar.watch([speedDataPath, licenseDataPath, helmetDataPath], {
    persistent: true,
    ignoreInitial: true
  });
  
  jsonWatcher.on('change', (filePath) => {
    let type = 'unknown';
    if (filePath.includes('speed_data')) {
      type = 'speed';
    } else if (filePath.includes('new_license_data')) {
      type = 'license';
    } else if (filePath.includes('helmet_data')) {
      type = 'helmet';
    }
    
    const data = readJsonFile(filePath);
    io.emit('data-update', { type, data });
  });
  
  // Watch image directories
  const imageWatcher = chokidar.watch([vehicleImagesPath, licensePlateImagesPath], {
    persistent: true,
    ignoreInitial: true
  });
  
  imageWatcher.on('add', (filePath) => {
    let type = 'unknown';
    let fileName = path.basename(filePath);
    
    if (filePath.includes('all_vehicle_detected_img')) {
      type = 'vehicle';
      io.emit('image-add', { type, path: `/api/images/vehicles/${fileName}` });
    } else if (filePath.includes('all_license_plate_img')) {
      type = 'license';
      io.emit('image-add', { type, path: `/api/images/licenses/${fileName}` });
    }
  });
  
  console.log('File watchers set up for real-time updates');
};

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/keep-alive', (_, res) => res.send('Still alive'));


// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setupWatchers();
}); 