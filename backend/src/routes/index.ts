import { Router } from 'express';

import { cache } from '../middleware/cache';
import { CACHE_TTL } from '../config/redis';
import { getLogs }                             from '../controllers/Log.controller';
import { getChallans, getChallanStats }        from '../controllers/Challan.controller';
import { getAccidents, getAccidentStats }      from '../controllers/Accident.controller';
import { getVehicleImages, getAccidentMedia }  from '../controllers/Images.controller';
import {
  getViolations,
  getVehicleTypes,
  getHourlyTraffic,
  getSpeedDistrib,
  getStats,
  getHotspots,
} from '../controllers/Analytics.controller';
import {
  getHospitals,
  getSignals,
  triggerSignal,
  getTrafficState,
} from '../controllers/Ambulance.controller';

const router = Router();

// ── Vehicle Logs ──────────────────────────────────────────────────────────────
// GET /api/logs?page&limit&search&speeding&helmetless&redLight&tripling
router.get('/logs', cache(CACHE_TTL.list), getLogs);

// ── Challans ──────────────────────────────────────────────────────────────────
// GET /api/challans?page&limit&search&status
// GET /api/challans/stats
router.get('/challans/stats', cache(CACHE_TTL.stats), getChallanStats);   // must be before /challans/:id
router.get('/challans',       cache(CACHE_TTL.list),  getChallans);

// ── Accidents ─────────────────────────────────────────────────────────────────
// GET /api/accidents?page&limit&severity
// GET /api/accidents/stats
router.get('/accidents/stats', cache(CACHE_TTL.stats), getAccidentStats);
router.get('/accidents',       cache(CACHE_TTL.list),  getAccidents);

// ── Vehicle Images ────────────────────────────────────────────────────────────
// GET /api/images/vehicles?page&limit&search
router.get('/images/vehicles', cache(CACHE_TTL.list), getVehicleImages);

// ── Accident Media ────────────────────────────────────────────────────────────
// GET /api/images/accidents?page&limit&search
router.get('/images/accidents', cache(CACHE_TTL.list), getAccidentMedia);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/violations',         cache(CACHE_TTL.analytics), getViolations);
router.get('/analytics/vehicle-types',      cache(CACHE_TTL.analytics), getVehicleTypes);
router.get('/analytics/hourly-traffic',     cache(CACHE_TTL.analytics), getHourlyTraffic);
router.get('/analytics/speed-distribution', cache(CACHE_TTL.analytics), getSpeedDistrib);
router.get('/analytics/stats',              cache(CACHE_TTL.stats),     getStats);
router.get('/analytics/hotspots',           cache(CACHE_TTL.analytics), getHotspots);

// ── Ambulance ─────────────────────────────────────────────────────────────
router.get('/ambulance/hospitals', getHospitals);
router.get('/ambulance/signals',   getSignals);
router.post('/ambulance/trigger-signal', triggerSignal);

// ── Signal State (simulation view) ────────────────────────────────────────
router.get('/signals/state', getTrafficState);

export default router;