import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { HOSPITALS, TRAFFIC_SIGNALS } from '../data/ambulance.data';

const TRAFFIC_JSON_PATH =
  process.env.TRAFFIC_JSON_PATH ||
  path.join(__dirname, '..', '..', '..', 'traffic_signal_simulation', 'traffic.json');

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

export const getHospitals = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.json({ data: HOSPITALS });
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

    // Reset all ambulance flags
    traffic['A1'] = false;
    traffic['A2'] = false;
    traffic['A3'] = false;
    traffic['A4'] = false;

    // Reset all R/Y/G so every lane is red by default
    for (let lane = 1; lane <= 4; lane++) {
      traffic[`R${lane}`] = true;
      traffic[`Y${lane}`] = false;
      traffic[`G${lane}`] = false;
    }

    // Turn the selected lane green for ambulance
    traffic[`A${signal.lane}`] = true;
    traffic[`R${signal.lane}`] = false;
    traffic[`G${signal.lane}`] = true;

    // Basic countdown for emergency phase
    // Support both timer formats:
    // - old: C
    // - new: C1..C4 (per-lane countdown)
    traffic['C'] = 15;
    for (let lane = 1; lane <= 4; lane++) {
      const key = `C${lane}`;
      if (typeof traffic[key] === 'number') traffic[key] = lane === signal.lane ? 15 : 0;
    }

    saveTrafficJson(traffic);

    res.json({
      success: true,
      message: `Signal ${signal.name} triggered - Lane ${signal.lane} green for ambulance`,
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
