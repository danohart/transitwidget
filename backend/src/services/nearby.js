import { getTrainStopsNear, CTA_LINES } from "./cta.js";
import { queryBusStopsNear, busStopCount } from "./busCache.js";

const EARTH_RADIUS_MI = 1000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance in miles between two lat/lon points.
 */
function distanceMiles(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Determine which CTA rail lines serve a Socrata train-stop row.
 * The row has boolean string fields: red, blue, g, brn, p, pexp, y, pnk, o.
 */
function linesFromRow(row) {
  return Object.keys(CTA_LINES).filter(
    (key) => row[key] === "true" || row[key] === true,
  );
}

/**
 * Find nearby train and bus stops for a given venue lat/lon.
 * Returns a structured object ready to be cached and served to the widget.
 */
export async function findNearbyStops(venueLat, venueLon) {
  const [trainResult] = await Promise.allSettled([
    getTrainStopsNear(venueLat, venueLon, 800), // ~0.5 miles
  ]);

  if (trainResult.status === "rejected") {
    console.error("Train stops fetch failed:", trainResult.reason);
  }

  const rawTrainStops =
    trainResult.status === "fulfilled" ? trainResult.value : [];

  // Bus stops come from the local SQLite cache (populated on startup via CTA Bus API)
  const cacheReady = busStopCount() > 0;
  const rawBusStops = cacheReady
    ? queryBusStopsNear(venueLat, venueLon, 400)
    : [];

  // --- Train stops ---
  // De-duplicate by station_name (a station can have multiple platform rows)
  const stationMap = new Map();
  for (const row of rawTrainStops) {
    const lat = Number.parseFloat(row.location?.latitude ?? row.stop_lat);
    const lon = Number.parseFloat(row.location?.longitude ?? row.stop_lon);
    const dist = distanceMiles(venueLat, venueLon, lat, lon);
    const name = row.station_name || row.stop_name;
    const lines = linesFromRow(row);

    if (!stationMap.has(name)) {
      stationMap.set(name, {
        name,
        lines: new Set(lines),
        distanceMiles: dist,
        lat,
        lon,
      });
    } else {
      const existing = stationMap.get(name);
      lines.forEach((l) => existing.lines.add(l));
      if (dist < existing.distanceMiles) existing.distanceMiles = dist;
    }
  }

  const trainStops = [...stationMap.values()]
    .map((s) => ({
      name: s.name,
      lines: [...s.lines].map((key) => ({ key, ...CTA_LINES[key] })),
      distanceMiles: Math.round(s.distanceMiles * 100) / 100,
      lat: s.lat,
      lon: s.lon,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  // --- Bus stops (from local SQLite cache, populated via CTA Bus Tracker API) ---
  const busStops = rawBusStops
    .map((stop) => ({
      ...stop,
      distanceMiles:
        Math.round(
          distanceMiles(venueLat, venueLon, stop.lat, stop.lon) * 100,
        ) / 100,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, 5);

  return { trainStops, busStops };
}
