import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../../vehicle_data_with_helmet');

interface AccidentData {
  accident_id: string;
  first_detected_frame: number;
  last_updated: string;
  total_frames: number;
  confidence: number;
  status: string;
  total_vehicles: number;
  vehicle_ids: number[];
  completed_at: string;
  duration_frames: number;
}

interface VehicleImageFile {
  filename: string;
  vehicleType: string;
  vehicleId: string;
  path: string;
}


/**
 * Parse vehicle image filename to extract type and ID
 */
function parseVehicleFilename(filename: string): VehicleImageFile | null {
  // Format: car_106.jpg, bike_42.jpg, bus_270.jpg
  const match = filename.match(/^(car|bike|bus|truck|auto)_(\d+)\.(jpg|jpeg|png)$/i);
  if (!match) return null;
  
  return {
    filename,
    vehicleType: match[1].charAt(0).toUpperCase() + match[1].slice(1), // Capitalize
    vehicleId: match[2],
    path: `all_vehicle_detected_img/${filename}`
  };
}

/**
 * Scan and seed vehicle logs and images from actual image files
 */
async function seedVehicleData(): Promise<number> {
  const vehicleImgDir = path.join(DATA_DIR, 'all_vehicle_detected_img');
  const licensePlateDir = path.join(DATA_DIR, 'all_license_plate_img');
  
  if (!fs.existsSync(vehicleImgDir)) {
    console.log('⚠️  Vehicle images directory not found');
    return 0;
  }

  const imageFiles = fs.readdirSync(vehicleImgDir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .map(parseVehicleFilename)
    .filter((v): v is VehicleImageFile => v !== null);

  console.log(`\n🚗 Found ${imageFiles.length} vehicle images\n`);

  // Get available license plate images
  const licensePlates = fs.existsSync(licensePlateDir) 
    ? fs.readdirSync(licensePlateDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    : [];

  let insertedCount = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const vehicle = imageFiles[i];
    try {
      // Generate fake license number based on vehicle ID
      const licenseNo = `DL${vehicle.vehicleId.padStart(4, '0')}`;
      
      // Random location from common areas
      const locations = ['MG Road', 'Connaught Place', 'Rajpath', 'Kasturba Gandhi Marg', 'India Gate'];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Random speed between 20-80
      const speed = 20 + Math.floor(Math.random() * 60);
      
      // Helmet status: true for bikes, null for others
      const helmetStatus = vehicle.vehicleType === 'Bike' ? Math.random() > 0.3 : null;
      
      // Insert into vehicle_logs
      const logResult = await pool.query(
        `INSERT INTO vehicle_logs 
         (license_no, vehicle_type, location, speed, helmet_status, red_light_cross, tripling, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30))
         RETURNING log_id`,
        [licenseNo, vehicle.vehicleType, location, speed, helmetStatus, false, false]
      );

      const logId = logResult.rows[0].log_id;

      // Cycle through available license plate images
      const licensePlatePath = licensePlates.length > 0
        ? `all_license_plate_img/${licensePlates[i % licensePlates.length]}`
        : null;

      // Insert into vehicle_images
      await pool.query(
        `INSERT INTO vehicle_images 
         (log_id, license_no, vehicle_type, image_path, license_plate_path, captured_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30))`,
        [logId, licenseNo, vehicle.vehicleType, vehicle.path, licensePlatePath]
      );

      console.log(`✅ ${vehicle.filename} + ${licensePlates[i % licensePlates.length] || 'N/A'} → ${licenseNo}`);
      insertedCount++;
    } catch (error) {
      console.error(`❌ Error inserting ${vehicle.filename}:`, (error as Error).message);
    }
  }

  console.log(`\n📊 Vehicle data: ${insertedCount} records inserted\n`);
  return insertedCount;
}

/**
 * Seed accident data from JSON files to database
 */
async function seedAccidentData(): Promise<number> {
  const accidentDataDir = path.join(DATA_DIR, 'accident_data');
  
  if (!fs.existsSync(accidentDataDir)) {
    console.log('❌ Accident data directory not found:', accidentDataDir);
    return 0;
  }

  const folders = fs.readdirSync(accidentDataDir)
    .filter(f => fs.statSync(path.join(accidentDataDir, f)).isDirectory());

  console.log(`\n📁 Found ${folders.length} accident folders\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const folder of folders) {
    const summaryPath = path.join(accidentDataDir, folder, 'accident_summary.json');
    
    if (!fs.existsSync(summaryPath)) {
      console.log(`⚠️  Skipping ${folder}: accident_summary.json not found`);
      continue;
    }

    try {
      const data: AccidentData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      
      // Parse dates - handle format like "2026-02-20 23:26:30"
      const occurredAt = data.last_updated ? data.last_updated.replace(' ', 'T') : new Date().toISOString();
      const completedAt = data.completed_at ? data.completed_at.replace(' ', 'T') : null;
      
      // Insert accident record
      const result = await pool.query(
        `INSERT INTO accidents 
         (accident_id, first_detected_frame, total_frames, confidence, status, total_vehicles, occurred_at, completed_at, severity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (accident_id) DO UPDATE SET
           total_frames = EXCLUDED.total_frames,
           confidence = EXCLUDED.confidence,
           status = EXCLUDED.status,
           total_vehicles = EXCLUDED.total_vehicles,
           completed_at = EXCLUDED.completed_at
         RETURNING accident_id`,
        [
          data.accident_id,
          data.first_detected_frame,
          data.total_frames,
          data.confidence,
          data.status,
          data.total_vehicles,
          occurredAt,
          completedAt,
          data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low'
        ]
      );

      // Insert accident vehicles if vehicle_ids exist
      if (data.vehicle_ids && data.vehicle_ids.length > 0) {
        // Get existing vehicle logs to link
        const vehicleLogs = await pool.query(
          'SELECT log_id, license_no, vehicle_type, speed FROM vehicle_logs ORDER BY log_id LIMIT $1',
          [data.vehicle_ids.length]
        );

        for (let i = 0; i < Math.min(data.vehicle_ids.length, vehicleLogs.rows.length); i++) {
          const log = vehicleLogs.rows[i];
          await pool.query(
            `INSERT INTO accident_vehicles (accident_id, license_no, vehicle_type, speed)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [data.accident_id, log.license_no, log.vehicle_type, log.speed]
          );
        }
        console.log(`✅ ${result.rows[0].accident_id} + ${data.vehicle_ids.length} vehicles`);
      } else {
        console.log(`✅ ${result.rows[0].accident_id}`);
      }
      
      successCount++;
    } catch (error) {
      console.error(`❌ Error syncing ${folder}:`, (error as Error).message);
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} inserted, ${errorCount} failed\n`);
  return successCount;
}

/**
 * Seed all existing images from folders
 */
async function seedImages(): Promise<number> {
  const imageSourceDirs = [
    'all_vehicle_detected_img',
    'all_license_plate_img',
    'new_sort_license_plate_img'
  ];

  const publicDir = path.join(__dirname, '../../..', 'frontend/public/uploads');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  let totalCopied = 0;

  for (const sourceDir of imageSourceDirs) {
    const sourcePath = path.join(DATA_DIR, sourceDir);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  ${sourceDir} not found, skipping`);
      continue;
    }

    const targetCategory = path.join(publicDir, sourceDir);
    if (!fs.existsSync(targetCategory)) {
      fs.mkdirSync(targetCategory, { recursive: true });
    }

    const files = fs.readdirSync(sourcePath).filter(f => 
      /\.(jpg|jpeg|png|gif)$/i.test(f)
    );

    let copyCount = 0;
    for (const file of files) {
      const source = path.join(sourcePath, file);
      const target = path.join(targetCategory, file);
      
      // Only copy if doesn't exist
      if (!fs.existsSync(target)) {
        fs.copyFileSync(source, target);
        copyCount++;
      }
    }

    console.log(`📸 ${sourceDir}: ${copyCount} images copied (${files.length} total)`);
    totalCopied += copyCount;
  }

  console.log(`\n🖼️  Total images synced: ${totalCopied}\n`);
  return totalCopied;
}

/**
 * Main seed function
 */
async function runSeed(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   🌱 Seeding All Data to Database 🌱   ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  try {
    // 1. Seed vehicle logs and images from actual files
    const vehicleCount = await seedVehicleData();
    
    // 2. Seed accident data
    const acciCount = await seedAccidentData();
    
    // 3. Copy physical images to frontend
    const imgCount = await seedImages();

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║            ✨ Seed Complete! ✨            ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║  Vehicles:       ${String(vehicleCount).padStart(4)} records          ║`);
    console.log(`║  Accidents:      ${String(acciCount).padStart(4)} records          ║`);
    console.log(`║  Image Files:    ${String(imgCount).padStart(4)} copied           ║`);
    console.log('╚═══════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run directly
runSeed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { seedAccidentData, seedVehicleData, seedImages };
