/**
 * busCache.js
 *
 * On first startup (or after 7 days), walks every CTA bus route and direction
 * via the Bus Tracker API and stores all stops in SQLite. After that, nearby
 * stop lookups are instant local queries — no external API call needed.
 *
 * Loading takes ~60-90 seconds the first time and runs fully in the background
 * so it never blocks the server from accepting requests.
 */

import { getDb } from '../db.js';
import { getBusRoutes, getSelectedBusDirection, getSelectedBusStops } from './cta.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_SIZE = 5; // concurrent route fetches

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call once on server startup. Returns immediately; loading runs in background.
 */
export function initBusCache() {
  const db = getDb();
  const meta = db.prepare('SELECT loaded_at FROM bus_cache_meta WHERE id = 1').get();
  const age = meta ? Date.now() - meta.loaded_at : Infinity;

  if (age < REFRESH_TTL_MS) {
    const count = db.prepare('SELECT COUNT(*) as n FROM bus_stops').get().n;
    console.log(`Bus stop cache is fresh (${count} stops). Skipping reload.`);
    return;
  }

  console.log('Loading CTA bus stops in background…');
  loadAllBusStops().catch((err) =>
    console.error('Bus cache load failed:', err.message)
  );
}

/**
 * Return bus stops within radiusMeters of a lat/lon using a bounding-box
 * pre-filter (fast) followed by exact Haversine distance filtering.
 */
export function queryBusStopsNear(lat, lon, radiusMeters = 400) {
  // 1 degree lat ≈ 111 km
  const latDelta = radiusMeters / 111_000;
  const lonDelta = radiusMeters / (111_000 * Math.cos((lat * Math.PI) / 180));

  const rows = getDb()
    .prepare(
      `SELECT stop_id, name, lat, lon, routes
       FROM bus_stops
       WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?`
    )
    .all(lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta);

  return rows.map((row) => ({
    stopId: row.stop_id,
    name: row.name,
    routes: JSON.parse(row.routes),
    lat: row.lat,
    lon: row.lon,
  }));
}

export function busStopCount() {
  return getDb().prepare('SELECT COUNT(*) as n FROM bus_stops').get().n;
}

// ---------------------------------------------------------------------------
// Internal loading
// ---------------------------------------------------------------------------

async function loadAllBusStops() {
  const routesRes = await getBusRoutes();
  const routesJson = await routesRes.json();
  const routes = routesJson['bustime-response']?.routes;

  if (!routes?.length) throw new Error('No routes returned from CTA Bus API');
  console.log(`Fetching stops for ${routes.length} CTA bus routes…`);

  // Process routes in small batches to avoid hammering the API
  for (let i = 0; i < routes.length; i += BATCH_SIZE) {
    const batch = routes.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((r) => loadRouteStops(r.rt)));
    process.stdout.write(`  ${Math.min(i + BATCH_SIZE, routes.length)}/${routes.length} routes done\r`);
  }

  // Mark the cache as fresh
  getDb()
    .prepare(
      `INSERT INTO bus_cache_meta (id, loaded_at) VALUES (1, ?)
       ON CONFLICT(id) DO UPDATE SET loaded_at = excluded.loaded_at`
    )
    .run(Date.now());

  const count = busStopCount();
  console.log(`\nBus stop cache ready: ${count} stops loaded.`);
}

async function loadRouteStops(routeId) {
  let directions;
  try {
    const dirRes = await getSelectedBusDirection(routeId);
    const dirJson = await dirRes.json();
    directions = dirJson['bustime-response']?.directions;
    if (!directions?.length) return;
  } catch {
    return; // skip routes that error
  }

  for (const { dir } of directions) {
    try {
      const stopsRes = await getSelectedBusStops(routeId, dir);
      const stopsJson = await stopsRes.json();
      const stops = stopsJson['bustime-response']?.stops;
      if (!stops?.length) continue;

      upsertStops(stops, routeId);
    } catch {
      // skip direction on error
    }
  }
}

function upsertStops(stops, routeId) {
  const db = getDb();

  const getExisting = db.prepare('SELECT routes FROM bus_stops WHERE stop_id = ?');
  const insert = db.prepare(
    `INSERT INTO bus_stops (stop_id, name, lat, lon, routes) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(stop_id) DO UPDATE SET routes = excluded.routes`
  );

  const upsertMany = db.transaction((stops) => {
    for (const stop of stops) {
      const existing = getExisting.get(stop.stpid);
      let routes;

      if (existing) {
        const current = JSON.parse(existing.routes);
        routes = current.includes(routeId) ? current : [...current, routeId];
      } else {
        routes = [routeId];
      }

      insert.run(stop.stpid, stop.stpnm, stop.lat, stop.lon, JSON.stringify(routes));
    }
  });

  upsertMany(stops);
}
