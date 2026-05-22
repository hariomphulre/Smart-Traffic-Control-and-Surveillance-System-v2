import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { FIRE_STATIONS, TRAFFIC_SIGNALS } from '../data/firebrigade.data';

const TRAFFIC_JSON_PATH =
  process.env.TRAFFIC_JSON_PATH ||
  path.join(process.cwd(), '..', 'ml_service', 'traffic_signal_simulation', 'traffic.json');

function loadTrafficJson(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(TRAFFIC_JSON_PATH, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function saveTrafficJson(data: Record<string, unknown>): void {
  const dir = path.dirname(TRAFFIC_JSON_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TRAFFIC_JSON_PATH, JSON.stringify(data));
}

export const getFireStations = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.json({ data: FIRE_STATIONS });
  } catch (err) {
    next(err);
  }
};

export const getSignals = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.json({ data: TRAFFIC_SIGNALS });
  } catch (err) {
    next(err);
  }
};

export const triggerSignal = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { signalId } = req.body as { signalId?: string };
    if (!signalId) {
      res.status(400).json({ error: 'signalId is required' });
      return;
    }

    const signal = TRAFFIC_SIGNALS.find((s) => s.id === signalId);
    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    const traffic = loadTrafficJson();

    // Reset all fire brigade flags
    traffic['F1'] = false;
    traffic['F2'] = false;
    traffic['F3'] = false;
    traffic['F4'] = false;

    // Reset all R/Y/G so every lane is red by default
    for (let lane = 1; lane <= 4; lane++) {
      traffic[`R${lane}`] = true;
      traffic[`Y${lane}`] = false;
      traffic[`G${lane}`] = false;
    }

    // Turn the selected lane green for fire brigade
    traffic[`F${signal.lane}`] = true;
    traffic[`R${signal.lane}`] = false;
    traffic[`G${signal.lane}`] = true;

    // Fire brigade gets extended green time (20 seconds instead of 15)
    traffic['C'] = 20;
    for (let lane = 1; lane <= 4; lane++) {
      const key = `C${lane}`;
      if (typeof traffic[key] === 'number') traffic[key] = lane === signal.lane ? 20 : 0;
    }

    saveTrafficJson(traffic);

    res.json({
      success: true,
      message: `Signal ${signal.name} triggered - Lane ${signal.lane} green for fire brigade`,
      signalId: signal.id,
    });
  } catch (err) {
    next(err);
  }
};

export const getTrafficState = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const traffic = loadTrafficJson();
    res.json(traffic);
  } catch (err) {
    next(err);
  }
};

/**
 * Override signal within 1km distance for fire brigade
 */
export const overrideSignalWithinRadius = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { signalId, vehicleLocation } = req.body as {
      signalId?: string;
      vehicleLocation?: { lat: number; lng: number };
    };

    if (!signalId || !vehicleLocation) {
      res.status(400).json({ error: 'signalId and vehicleLocation are required' });
      return;
    }

    const signal = TRAFFIC_SIGNALS.find((s) => s.id === signalId);
    if (!signal) {
      res.status(404).json({ error: 'Signal not found' });
      return;
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((signal.lat - vehicleLocation.lat) * Math.PI) / 180;
    const dLng = ((signal.lng - vehicleLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((vehicleLocation.lat * Math.PI) / 180) *
        Math.cos((signal.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in km

    // Check if within 1km
    if (distance > 1) {
      res.status(400).json({
        error: `Signal is ${distance.toFixed(2)}km away. Must be within 1km to override.`,
      });
      return;
    }

    // Apply signal override
    const traffic = loadTrafficJson();

    // Reset all fire brigade flags
    for (let lane = 1; lane <= 4; lane++) {
      traffic[`F${lane}`] = false;
    }

    // Turn the selected lane green for fire brigade
    traffic[`F${signal.lane}`] = true;
    traffic[`R${signal.lane}`] = false;
    traffic[`G${signal.lane}`] = true;
    traffic[`Y${signal.lane}`] = false;

    traffic['C'] = 20;
    for (let lane = 1; lane <= 4; lane++) {
      const key = `C${lane}`;
      if (typeof traffic[key] === 'number') traffic[key] = lane === signal.lane ? 20 : 0;
    }

    saveTrafficJson(traffic);

    res.json({
      success: true,
      message: `Signal override activated - Lane ${signal.lane} green for fire brigade (within ${distance.toFixed(2)}km)`,
      signalId: signal.id,
      distance: distance.toFixed(2),
    });
  } catch (err) {
    next(err);
  }
};
