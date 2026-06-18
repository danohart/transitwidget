/**
 * seed-bus-stops.js
 *
 * Fetches all CTA bus stops via the Bus Tracker API and stores them in Neon.
 * Run once before deploying, and re-run monthly or when CTA changes routes.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-bus-stops.js
 *
 * Requires in .env.local:
 *   DATABASE_URL=postgres://...
 *   CTA_BUS_API=your_key
 */

import { neon } from '@neondatabase/serverless';
import { initSchema } from '../lib/db.js';
import { getBusRoutes, getSelectedBusDirection, getSelectedBusStops } from '../lib/cta.js';

const sql = neon(process.env.DATABASE_URL);
const BATCH_SIZE = 5;

async function upsertStops(stops, routeId) {
  for (const stop of stops) {
    const [existing] = await sql`SELECT routes FROM bus_stops WHERE stop_id = ${stop.stpid}`;

    let routes;
    if (existing) {
      const current = JSON.parse(existing.routes);
      routes = current.includes(routeId) ? current : [...current, routeId];
    } else {
      routes = [routeId];
    }

    await sql`
      INSERT INTO bus_stops (stop_id, name, lat, lon, routes)
      VALUES (${stop.stpid}, ${stop.stpnm}, ${stop.lat}, ${stop.lon}, ${JSON.stringify(routes)})
      ON CONFLICT (stop_id)
      DO UPDATE SET routes = EXCLUDED.routes`;
  }
}

async function loadRouteStops(routeId) {
  let directions;
  try {
    const dirRes = await getSelectedBusDirection(routeId);
    const dirJson = await dirRes.json();
    directions = dirJson['bustime-response']?.directions;
    if (!directions?.length) return;
  } catch {
    return;
  }

  for (const { dir } of directions) {
    try {
      const stopsRes = await getSelectedBusStops(routeId, dir);
      const stopsJson = await stopsRes.json();
      const stops = stopsJson['bustime-response']?.stops;
      if (!stops?.length) continue;
      await upsertStops(stops, routeId);
    } catch {
      // skip on error
    }
  }
}

async function main() {
  console.log('Initializing schema…');
  await initSchema();

  console.log('Fetching CTA bus routes…');
  const routesRes = await getBusRoutes();
  const routesJson = await routesRes.json();
  const routes = routesJson['bustime-response']?.routes;

  if (!routes?.length) throw new Error('No routes returned from CTA Bus API');
  console.log(`Loading stops for ${routes.length} routes (this takes ~90 seconds)…\n`);

  for (let i = 0; i < routes.length; i += BATCH_SIZE) {
    const batch = routes.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((r) => loadRouteStops(r.rt)));
    process.stdout.write(`  ${Math.min(i + BATCH_SIZE, routes.length)}/${routes.length} routes done\r`);
  }

  const [{ count }] = await sql`SELECT COUNT(*) as count FROM bus_stops`;
  console.log(`\nDone. ${count} bus stops in Neon.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
