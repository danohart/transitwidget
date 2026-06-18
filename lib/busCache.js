/**
 * busCache.js — Neon Postgres version
 *
 * Bus stop data is seeded once via scripts/seed-bus-stops.js.
 * This module only handles queries — no background loading.
 */

import sql from './db.js';

const EARTH_RADIUS_MI = 3958.8;

function toRad(deg) { return (deg * Math.PI) / 180; }

function distanceMiles(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Return bus stops within radiusMeters of a lat/lon.
 * Uses a bounding-box SQL query (fast index scan) then exact Haversine filtering.
 */
export async function queryBusStopsNear(lat, lon, radiusMeters = 400) {
  const latDelta = radiusMeters / 111_000;
  const lonDelta = radiusMeters / (111_000 * Math.cos(toRad(lat)));

  const rows = await sql`
    SELECT stop_id, name, lat, lon, routes
    FROM bus_stops
    WHERE lat BETWEEN ${lat - latDelta} AND ${lat + latDelta}
      AND lon BETWEEN ${lon - lonDelta} AND ${lon + lonDelta}`;

  return rows.map((row) => ({
    stopId: row.stop_id,
    name: row.name,
    routes: JSON.parse(row.routes),
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
    distanceMiles: Math.round(distanceMiles(lat, lon, parseFloat(row.lat), parseFloat(row.lon)) * 100) / 100,
  }));
}
