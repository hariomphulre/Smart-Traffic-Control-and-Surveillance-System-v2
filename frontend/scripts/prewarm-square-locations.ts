#!/usr/bin/env npx tsx
/**
 * Prewarm intersection analysis cache for all MAP_SIGNALS.
 * Run from frontend/: npx tsx scripts/prewarm-square-locations.ts
 * Requires dev server OR set BASE_URL (default http://localhost:3000)
 */
import { MAP_SIGNALS } from '../map/MapData';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const DELAY_MS = 1500;

async function main() {
  console.log(`Prewarming ${MAP_SIGNALS.length} signals via ${BASE_URL}…`);
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < MAP_SIGNALS.length; i++) {
    const signal = MAP_SIGNALS[i];
    try {
      const res = await fetch(
        `${BASE_URL}/api/intersection/analyze?signalId=${encodeURIComponent(signal.id)}`,
      );
      if (res.ok) {
        const data = await res.json();
        ok++;
        console.log(
          `[${i + 1}/${MAP_SIGNALS.length}] ${signal.id} → ${data.wayCount} ways (${data.ways?.map((w: { id: string }) => w.id).join(', ')})${data.snapped ? ' [snapped]' : ''}`,
        );
      } else {
        fail++;
        console.warn(`[${i + 1}/${MAP_SIGNALS.length}] ${signal.id} FAILED ${res.status}`);
      }
    } catch (err) {
      fail++;
      console.warn(`[${i + 1}/${MAP_SIGNALS.length}] ${signal.id} ERROR`, err);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main();
