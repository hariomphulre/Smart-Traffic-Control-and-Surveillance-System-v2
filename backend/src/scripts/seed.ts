import 'dotenv/config';
import pool from '../config/db';

const seed = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...\n');

    // ── 1. Vehicles ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO vehicle_rc_details (registration_number, owner_name, vehicle_type, make, model, year, color)
      VALUES
        ('DL-01-AB-1234', 'Rahul Sharma',   'Car',   'Maruti',     'Swift',   2020, 'White'),
        ('MH-12-CD-5678', 'Priya Mehta',    'Bike',  'Honda',      'Activa',  2021, 'Red'),
        ('KA-03-EF-9012', 'Arun Kumar',     'Truck', 'Tata',       '407',     2019, 'Blue'),
        ('TN-07-GH-3456', 'Sunita Rao',     'Bus',   'Ashok',      'Viking',  2018, 'Yellow'),
        ('GJ-05-IJ-7890', 'Vikram Singh',   'Auto',  'Bajaj',      'RE',      2022, 'Green'),
        ('UP-32-KL-2345', 'Deepak Verma',   'Car',   'Hyundai',    'i20',     2021, 'Silver'),
        ('RJ-14-MN-6789', 'Kavita Joshi',   'Bike',  'Yamaha',     'FZ',      2020, 'Black'),
        ('MP-09-OP-1234', 'Suresh Patel',   'Car',   'Toyota',     'Innova',  2019, 'White'),
        ('PB-10-QR-5678', 'Anjali Gupta',   'Bike',  'TVS',        'Apache',  2022, 'Orange'),
        ('HR-26-ST-9012', 'Manish Yadav',   'Truck', 'Mahindra',   'Blazo',   2020, 'Grey')
      ON CONFLICT (registration_number) DO NOTHING;
    `);
    console.log('✅ Seeded vehicle_rc_details (10 vehicles)');

    // ── 2. Vehicle Logs ───────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO vehicle_logs
        (license_no, vehicle_type, location, speed, helmet_status, red_light_cross, tripling, detected_at)
      VALUES
        ('DL-01-AB-1234', 'Car',   'MG Road Junction',       65,  NULL,  FALSE, FALSE, NOW() - INTERVAL  '1 hour'),
        ('MH-12-CD-5678', 'Bike',  'Connaught Place',         45,  FALSE, TRUE,  FALSE, NOW() - INTERVAL  '2 hours'),
        ('KA-03-EF-9012', 'Truck', 'NH-8 Toll Plaza',         80,  NULL,  FALSE, FALSE, NOW() - INTERVAL  '3 hours'),
        ('TN-07-GH-3456', 'Bus',   'Airport Road',            55,  NULL,  TRUE,  FALSE, NOW() - INTERVAL  '4 hours'),
        ('GJ-05-IJ-7890', 'Auto',  'Railway Station Chowk',   30,  NULL,  FALSE, FALSE, NOW() - INTERVAL  '5 hours'),
        ('UP-32-KL-2345', 'Car',   'Civil Lines',             72,  NULL,  FALSE, FALSE, NOW() - INTERVAL  '6 hours'),
        ('RJ-14-MN-6789', 'Bike',  'Sadar Bazaar',            40,  TRUE,  FALSE, TRUE,  NOW() - INTERVAL  '7 hours'),
        ('MP-09-OP-1234', 'Car',   'MG Road Junction',        90,  NULL,  FALSE, FALSE, NOW() - INTERVAL  '8 hours'),
        ('PB-10-QR-5678', 'Bike',  'Bus Stand',               35,  FALSE, FALSE, TRUE,  NOW() - INTERVAL  '9 hours'),
        ('HR-26-ST-9012', 'Truck', 'Industrial Area Gate 4', 100,  NULL,  TRUE,  FALSE, NOW() - INTERVAL '10 hours'),
        ('DL-01-AB-1234', 'Car',   'Rajpath',                 50,  NULL,  FALSE, FALSE, NOW() - INTERVAL '11 hours'),
        ('MH-12-CD-5678', 'Bike',  'Lajpat Nagar',            20,  TRUE,  FALSE, FALSE, NOW() - INTERVAL '12 hours'),
        ('RJ-14-MN-6789', 'Bike',  'Nehru Place',             25,  FALSE, FALSE, FALSE, NOW() - INTERVAL '13 hours'),
        ('KA-03-EF-9012', 'Truck', 'Gurgaon Toll',            95,  NULL,  FALSE, FALSE, NOW() - INTERVAL '14 hours'),
        ('GJ-05-IJ-7890', 'Auto',  'Karol Bagh',              15,  NULL,  FALSE, FALSE, NOW() - INTERVAL '15 hours');
    `);
    console.log('✅ Seeded vehicle_logs (15 records)');

    // ── 3. Challans ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO vehicle_challan_details
        (registration_number, challan_number, violation_type, fine_amount, penalty_amount,
         challan_status, location, officer_name, due_date, payment_date, payment_mode, created_at)
      VALUES
        ('DL-01-AB-1234','CH2024001','Over Speeding',       2000, 0,   'pending',  'MG Road Junction',       'Insp. Ravi Kumar',  CURRENT_DATE+30, NULL,                     NULL,   NOW()-INTERVAL '5 days'),
        ('MH-12-CD-5678','CH2024002','No Helmet',            500, 0,   'received', 'Connaught Place',         'Insp. Priya Singh', CURRENT_DATE-10, NOW()-INTERVAL '2 days',  'UPI',  NOW()-INTERVAL '10 days'),
        ('KA-03-EF-9012','CH2024003','Red Light Violation', 1000, 0,   'pending',  'NH-8 Toll Plaza',         'Insp. Suresh Nair', CURRENT_DATE+20, NULL,                     NULL,   NOW()-INTERVAL '3 days'),
        ('TN-07-GH-3456','CH2024004','Over Speeding',       2000, 500, 'rejected', 'Airport Road',            'Insp. Mohan Das',   CURRENT_DATE-5,  NULL,                     NULL,   NOW()-INTERVAL '15 days'),
        ('RJ-14-MN-6789','CH2024005','Triple Riding',       1000, 0,   'pending',  'Sadar Bazaar',            'Insp. Amit Yadav',  CURRENT_DATE+25, NULL,                     NULL,   NOW()-INTERVAL '1 day'),
        ('MP-09-OP-1234','CH2024006','Over Speeding',       2000, 0,   'received', 'MG Road Junction',       'Insp. Ravi Kumar',  CURRENT_DATE-20, NOW()-INTERVAL '5 days',  'Cash', NOW()-INTERVAL '25 days'),
        ('PB-10-QR-5678','CH2024007','No Helmet',            500, 0,   'pending',  'Bus Stand',               'Insp. Asha Verma',  CURRENT_DATE+15, NULL,                     NULL,   NOW()-INTERVAL '2 days'),
        ('HR-26-ST-9012','CH2024008','Red Light Violation', 1000, 250, 'received', 'Industrial Area Gate 4', 'Insp. Ramu Sharma', CURRENT_DATE-8,  NOW()-INTERVAL '1 day',   'Card', NOW()-INTERVAL '12 days'),
        ('GJ-05-IJ-7890','CH2024009','Over Speeding',       2000, 0,   'pending',  'Railway Station Chowk', 'Insp. Priya Singh', CURRENT_DATE+10, NULL,                     NULL,   NOW()-INTERVAL '4 days'),
        ('UP-32-KL-2345','CH2024010','Red Light Violation', 1000, 0,   'rejected', 'Civil Lines',            'Insp. Deepak Roy',  CURRENT_DATE-3,  NULL,                     NULL,   NOW()-INTERVAL '8 days');
    `);
    console.log('✅ Seeded vehicle_challan_details (10 records)');

    // ── 4. Accidents ──────────────────────────────────────────────────────────
    const { rows: accRows } = await client.query<{ accident_id: number }>(`
      INSERT INTO accidents (location, description, severity, has_recording, occurred_at)
      VALUES
        ('MG Road Junction',      '2-vehicle high severity collision. Multiple injuries reported. Emergency services dispatched.',  'high',   TRUE,  NOW()-INTERVAL  '2 days'),
        ('NH-8 Toll Plaza',       'Minor rear-end collision. No injuries. Traffic briefly disrupted.',                              'low',    FALSE, NOW()-INTERVAL  '4 days'),
        ('Airport Road',          'Medium severity collision between bus and car. One hospitalization reported.',                   'medium', TRUE,  NOW()-INTERVAL  '6 days'),
        ('Sadar Bazaar',          'Bike skid accident. Rider injured. Single vehicle involved.',                                    'medium', TRUE,  NOW()-INTERVAL  '8 days'),
        ('Industrial Area Gate 4','Fire detected in truck cabin. Fire brigade deployed immediately. No casualties.',                'high',   TRUE,  NOW()-INTERVAL '10 days')
      RETURNING accident_id;
    `);
    const [a1, a2, a3, a4, a5] = accRows.map((r) => r.accident_id);
    console.log('✅ Seeded accidents (5 records)');

    // ── 5. Accident Vehicles ──────────────────────────────────────────────────
    await client.query(`
      INSERT INTO accident_vehicles (accident_id, license_no, vehicle_type, speed)
      VALUES
        ($1, 'DL-01-AB-1234', 'Car',   65),
        ($1, 'UP-32-KL-2345', 'Car',   58),
        ($2, 'KA-03-EF-9012', 'Truck', 70),
        ($3, 'TN-07-GH-3456', 'Bus',   55),
        ($3, 'MP-09-OP-1234', 'Car',   48),
        ($4, 'RJ-14-MN-6789', 'Bike',  40),
        ($5, 'HR-26-ST-9012', 'Truck', 80);
    `, [a1, a2, a3, a4, a5]);
    console.log('✅ Seeded accident_vehicles (7 records)');

    // ── 6. Vehicle Images ─────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO vehicle_images (log_id, license_no, vehicle_type, image_path, license_plate_path, captured_at)
      VALUES
        (1,  'DL-01-AB-1234', 'Car',   '/local_data/all_vehicle_detected_img/vehicle_1.jpg',  '/local_data/all_license_plate_img/license_plate_1.jpg',  NOW()-INTERVAL  '1 hour'),
        (2,  'MH-12-CD-5678', 'Bike',  '/local_data/all_vehicle_detected_img/vehicle_2.jpg',  '/local_data/all_license_plate_img/license_plate_2.jpg',  NOW()-INTERVAL  '2 hours'),
        (3,  'KA-03-EF-9012', 'Truck', '/local_data/all_vehicle_detected_img/vehicle_3.jpg',  '/local_data/all_license_plate_img/license_plate_3.jpg',  NOW()-INTERVAL  '3 hours'),
        (4,  'TN-07-GH-3456', 'Bus',   '/local_data/all_vehicle_detected_img/vehicle_4.jpg',  '/local_data/all_license_plate_img/license_plate_4.jpg',  NOW()-INTERVAL  '4 hours'),
        (5,  'GJ-05-IJ-7890', 'Auto',  '/local_data/all_vehicle_detected_img/vehicle_5.jpg',  '/local_data/all_license_plate_img/license_plate_5.jpg',  NOW()-INTERVAL  '5 hours'),
        (6,  'UP-32-KL-2345', 'Car',   '/local_data/all_vehicle_detected_img/vehicle_6.jpg',  '/local_data/all_license_plate_img/license_plate_6.jpg',  NOW()-INTERVAL  '6 hours'),
        (7,  'RJ-14-MN-6789', 'Bike',  '/local_data/all_vehicle_detected_img/vehicle_7.jpg',  '/local_data/all_license_plate_img/license_plate_7.jpg',  NOW()-INTERVAL  '7 hours'),
        (8,  'MP-09-OP-1234', 'Car',   '/local_data/all_vehicle_detected_img/vehicle_8.jpg',  '/local_data/all_license_plate_img/license_plate_8.jpg',  NOW()-INTERVAL  '8 hours'),
        (9,  'PB-10-QR-5678', 'Bike',  '/local_data/all_vehicle_detected_img/vehicle_9.jpg',  '/local_data/all_license_plate_img/license_plate_9.jpg',  NOW()-INTERVAL  '9 hours'),
        (10, 'HR-26-ST-9012', 'Truck', '/local_data/all_vehicle_detected_img/vehicle_10.jpg', '/local_data/all_license_plate_img/license_plate_10.jpg', NOW()-INTERVAL '10 hours');
    `);
    console.log('✅ Seeded vehicle_images (10 records)');

    // ── 7. Accident Media ─────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO accident_media (accident_id, location, media_type, file_path, duration, severity, recorded_at)
      VALUES
        ($1, 'MG Road Junction',      'video', '/recordings/accident_1.mp4',       '60s',  'high',   NOW()-INTERVAL  '2 days'),
        ($1, 'MG Road Junction',      'image', '/recordings/accident_1_scene.jpg',  NULL,   'high',   NOW()-INTERVAL  '2 days'),
        ($2, 'NH-8 Toll Plaza',       'image', '/recordings/accident_2.jpg',        NULL,   'low',    NOW()-INTERVAL  '4 days'),
        ($3, 'Airport Road',          'video', '/recordings/accident_3.mp4',        '45s',  'medium', NOW()-INTERVAL  '6 days'),
        ($4, 'Sadar Bazaar',          'video', '/recordings/accident_4.mp4',        '30s',  'medium', NOW()-INTERVAL  '8 days'),
        ($5, 'Industrial Area Gate 4','video', '/recordings/accident_5_fire.mp4',   '120s', 'high',   NOW()-INTERVAL '10 days');
    `, [a1, a2, a3, a4, a5]);
    console.log('✅ Seeded accident_media (6 records)');

    console.log('\n🎉 All seeding complete!\n');
  } catch (err) {
    console.error('❌ Seed failed:', (err as Error).message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();