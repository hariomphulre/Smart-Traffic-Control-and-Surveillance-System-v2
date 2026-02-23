import fs from 'fs';
import path from 'path';
import { watch } from 'fs';
import pool from '../config/db';
import { sendAccidentAlert } from '../services/sms.service';

const DATA_DIR = path.join(__dirname, '../../../vehicle_data_with_helmet');
const DEBOUNCE_MS = 2000; // Wait 2s for file operations to complete
const watchedAccidents = new Set<string>();
let debounceTimers: Map<string, NodeJS.Timeout> = new Map();

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

/**
 * Sync specific accident from its folder path
 */
async function syncSingleAccident(folderPath: string): Promise<void> {
  const summaryPath = path.join(folderPath, 'accident_summary.json');

  if (!fs.existsSync(summaryPath)) return;

  try {
    const data: AccidentData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const accidentId = data.accident_id;

    // Skip if already synced recently
    if (watchedAccidents.has(accidentId)) return;
    watchedAccidents.add(accidentId);

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
      console.log(`✅ [AUTO-SYNC] ${result.rows[0].accident_id} + ${data.vehicle_ids.length} vehicles`);
    } else {
      console.log(`✅ [AUTO-SYNC] ${result.rows[0].accident_id}`);
    }
  } catch (error) {
    console.error(`❌ [AUTO-SYNC] Error syncing accident:`, error);
  }
}

/**
 * Watch for new accident folders
 */
function watchAccidentData(): void {
  const accidentDataDir = path.join(DATA_DIR, 'accident_data');

  if (!fs.existsSync(accidentDataDir)) {
    console.log('⚠️  Accident data directory not found, skipping accident watcher');
    return;
  }

  console.log('👁️  Watching accident data folder:', accidentDataDir);

  const watcher = watch(accidentDataDir, { recursive: false }, (eventType, filename) => {
    if (!filename || eventType !== 'rename') return; // rename = new folder created

    const folderPath = path.join(accidentDataDir, filename);

    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) return;

    console.log(`📁 Detected new accident folder: ${filename}`);

    const summaryPath = path.join(folderPath, 'accident_summary.json');

    if (!fs.existsSync(summaryPath)) return;

  
      const data: AccidentData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      const accidentSeverity = data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low';

      // Debounce to ensure file is fully written
      if (debounceTimers.has(filename)) {
        clearTimeout(debounceTimers.get(filename));
      }

      const timer = setTimeout(() => {
        syncSingleAccident(folderPath);
        sendAccidentAlert("+917666848035", `New ${accidentSeverity} severity accident detected at ${new Date().toLocaleTimeString()}.`);
        debounceTimers.delete(filename);
      }, DEBOUNCE_MS);

      debounceTimers.set(filename, timer);
    });

  watcher.on('error', (err) => console.error('❌ Accident watcher error:', err));
}

/**
 * Parse vehicle image filename to extract type and ID
 */
function parseVehicleFilename(filename: string): { vehicleType: string; vehicleId: string } | null {
  const match = filename.match(/^(car|bike|bus|truck|auto)_(\d+)\.(jpg|jpeg|png)$/i);
  if (!match) return null;

  return {
    vehicleType: match[1].charAt(0).toUpperCase() + match[1].slice(1),
    vehicleId: match[2]
  };
}

/**
 * Sync a new vehicle image to database
 */
async function syncVehicleImage(filename: string): Promise<void> {
  const vehicleInfo = parseVehicleFilename(filename);
  if (!vehicleInfo) return;

  try {
    // Check if already exists
    const existingResult = await pool.query(
      'SELECT log_id FROM vehicle_images WHERE image_path = $1',
      [`all_vehicle_detected_img/${filename}`]
    );

    if (existingResult.rows.length > 0) {
      console.log(`⚠️  Image ${filename} already in database, skipping`);
      return;
    }

    // Generate license number
    const licenseNo = `DL${vehicleInfo.vehicleId.padStart(4, '0')}`;

    // Random location and speed
    const locations = ['MG Road', 'Connaught Place', 'Rajpath', 'Kasturba Gandhi Marg', 'India Gate'];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const speed = 20 + Math.floor(Math.random() * 60);
    const helmetStatus = vehicleInfo.vehicleType === 'Bike' ? Math.random() > 0.3 : null;

    // Insert vehicle log
    const logResult = await pool.query(
      `INSERT INTO vehicle_logs 
       (license_no, vehicle_type, location, speed, helmet_status, red_light_cross, tripling, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING log_id`,
      [licenseNo, vehicleInfo.vehicleType, location, speed, helmetStatus, false, false]
    );

    const logId = logResult.rows[0].log_id;

    // Get a random license plate image
    const licensePlateDir = path.join(DATA_DIR, 'all_license_plate_img');
    let licensePlatePath = null;

    if (fs.existsSync(licensePlateDir)) {
      const licensePlateFiles = fs.readdirSync(licensePlateDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
      if (licensePlateFiles.length > 0) {
        const randomPlate = licensePlateFiles[Math.floor(Math.random() * licensePlateFiles.length)];
        licensePlatePath = `all_license_plate_img/${randomPlate}`;
      }
    }

    // Insert vehicle image record
    await pool.query(
      `INSERT INTO vehicle_images 
       (log_id, license_no, vehicle_type, image_path, license_plate_path, captured_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [logId, licenseNo, vehicleInfo.vehicleType, `all_vehicle_detected_img/${filename}`, licensePlatePath]
    );

    console.log(`✅ [AUTO-SYNC] Vehicle ${filename} → DB (${licenseNo})`);
  } catch (error) {
    console.error(`❌ [AUTO-SYNC] Error syncing vehicle ${filename}:`, error);
  }
}

/**
 * Watch for new images and copy to public folder + sync to DB
 */
function watchImages(): void {
  const imageSourceDirs = [
    'all_vehicle_detected_img',
    'all_license_plate_img',
    'new_sort_license_plate_img'
  ];

  const publicDir = path.join(__dirname, '../../..', 'frontend/public/uploads');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const sourceDir of imageSourceDirs) {
    const sourcePath = path.join(DATA_DIR, sourceDir);

    if (!fs.existsSync(sourcePath)) continue;

    const targetCategory = path.join(publicDir, sourceDir);
    if (!fs.existsSync(targetCategory)) {
      fs.mkdirSync(targetCategory, { recursive: true });
    }

    console.log(`👁️  Watching image folder: ${sourceDir}`);

    const watcher = watch(sourcePath, { recursive: false }, (eventType, filename) => {
      if (!filename || !/\.(jpg|jpeg|png|gif)$/i.test(filename)) return;

      const source = path.join(sourcePath, filename);
      const target = path.join(targetCategory, filename);

      // Debounce file copy
      if (debounceTimers.has(`${sourceDir}_${filename}`)) {
        clearTimeout(debounceTimers.get(`${sourceDir}_${filename}`));
      }

      const timer = setTimeout(async () => {
        try {
          if (fs.existsSync(source)) {
            // Copy image to frontend
            fs.copyFileSync(source, target);
            console.log(`📸 [AUTO-SYNC] Image copied: ${sourceDir}/${filename}`);

            // If it's a vehicle image, also sync to database
            if (sourceDir === 'all_vehicle_detected_img') {
              await syncVehicleImage(filename);
            }
          }
        } catch (err) {
          console.error(`❌ Error copying image:`, err);
        }
        debounceTimers.delete(`${sourceDir}_${filename}`);
      }, DEBOUNCE_MS);

      debounceTimers.set(`${sourceDir}_${filename}`, timer);
    });

    watcher.on('error', (err) => console.error(`❌ Image watcher error (${sourceDir}):`, err));
  }
}

/**
 * Start automatic watchers (runs in background)
 */
export function startWatchers(): void {
  console.log('\n🔄 Starting automatic data watchers...\n');
  watchAccidentData();
  watchImages();
  console.log('✨ Watchers initialized! New data will auto-sync.\n');
}

/**
 * Sync accident data from JSON files to database
 */
async function syncAccidentData(): Promise<void> {
  const accidentDataDir = path.join(DATA_DIR, 'accident_data');

  if (!fs.existsSync(accidentDataDir)) {
    console.log('❌ Accident data directory not found:', accidentDataDir);
    return;
  }

  const folders = fs.readdirSync(accidentDataDir).filter(f =>
    fs.statSync(path.join(accidentDataDir, f)).isDirectory()
  );

  console.log(`📁 Found ${folders.length} accident folders`);

  for (const folder of folders) {
    const summaryPath = path.join(accidentDataDir, folder, 'accident_summary.json');

    if (!fs.existsSync(summaryPath)) continue;

    try {
      const data: AccidentData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

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
          new Date(data.last_updated),
          new Date(data.completed_at),
          data.confidence > 0.8 ? 'high' : data.confidence > 0.5 ? 'medium' : 'low'
        ]
      );

      console.log(`✅ Synced accident: ${result.rows[0].accident_id}`);
    } catch (error) {
      console.error(`❌ Error syncing ${folder}:`, error);
    }
  }
}

/**
 * Sync vehicle data from JSON files to database
 */
async function syncVehicleData(): Promise<void> {
  try {
    const vehicleTypesPath = path.join(DATA_DIR, 'vehicle_types.json');
    const helmetDataPath = path.join(DATA_DIR, 'helmet_data.json');
    const speedDataPath = path.join(DATA_DIR, 'speed_data.json');

    if (fs.existsSync(vehicleTypesPath)) {
      const vehicleTypes: any = JSON.parse(fs.readFileSync(vehicleTypesPath, 'utf8'));
      console.log('📊 Vehicle types loaded:', Object.keys(vehicleTypes).length);
    }

    if (fs.existsSync(helmetDataPath)) {
      const helmetData: any = JSON.parse(fs.readFileSync(helmetDataPath, 'utf8'));
      console.log('🪖 Helmet data loaded:', Object.keys(helmetData).length);
    }

    if (fs.existsSync(speedDataPath)) {
      const speedData: any = JSON.parse(fs.readFileSync(speedDataPath, 'utf8'));
      console.log('⚡ Speed data loaded:', Object.keys(speedData).length);
    }
  } catch (error) {
    console.error('❌ Error syncing vehicle data:', error);
  }
}

/**
 * Sync images from source folders to frontend public folder
 */
async function syncImages(): Promise<void> {
  const imageSourceDirs = [
    'all_vehicle_detected_img',
    'all_license_plate_img',
    'new_sort_license_plate_img'
  ];

  const publicDir = path.join(__dirname, '../../..', 'frontend/public/uploads');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📂 Created public/uploads directory');
  }

  for (const sourceDir of imageSourceDirs) {
    const sourcePath = path.join(DATA_DIR, sourceDir);

    if (!fs.existsSync(sourcePath)) continue;

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

      // Only copy if doesn't exist or is newer
      if (!fs.existsSync(target)) {
        fs.copyFileSync(source, target);
        copyCount++;
      }
    }

    console.log(`📸 ${sourceDir}: ${copyCount} new images synced (${files.length} total)`);
  }
}

/**
 * Main sync function
 */
export async function runSync(): Promise<void> {
  console.log('\n🔄 Starting initial data sync...\n');

  try {
    await syncAccidentData();
    await syncVehicleData();
    await syncImages();

    console.log('\n✨ Initial data sync completed!\n');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  }
}

// Run if called directly as sync command
if (require.main === module) {
  runSync()
    .then(() => {
      console.log('\n🚀 Starting automatic watchers...');
      startWatchers();
      console.log('ℹ️  Press Ctrl+C to stop\n');
    })
    .catch(() => process.exit(1));
}
