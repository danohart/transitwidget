import { getTrainStopsNear, CTA_LINES } from './cta.js';
import { queryBusStopsNear } from './busCache.js';

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

function linesFromRow(row) {
  return Object.keys(CTA_LINES).filter((key) => row[key] === 'true' || row[key] === true);
}

export async function findNearbyStops(venueLat, venueLon) {
  const [trainResult, busResult] = await Promise.allSettled([
    getTrainStopsNear(venueLat, venueLon, 800),
    queryBusStopsNear(venueLat, venueLon, 400),
  ]);

  if (trainResult.status === 'rejected') console.error('Train stops error:', trainResult.reason);
  if (busResult.status === 'rejected')  console.error('Bus stops error:', busResult.reason);

  const rawTrainStops = trainResult.status === 'fulfilled' ? trainResult.value : [];
  const rawBusStops   = busResult.status   === 'fulfilled' ? busResult.value   : [];

  const stationMap = new Map();
  for (const row of rawTrainStops) {
    const lat  = parseFloat(row.location?.latitude  ?? row.stop_lat);
    const lon  = parseFloat(row.location?.longitude ?? row.stop_lon);
    const dist = distanceMiles(venueLat, venueLon, lat, lon);
    const name = row.station_name || row.stop_name;
    const lines = linesFromRow(row);

    if (!stationMap.has(name)) {
      stationMap.set(name, { name, lines: new Set(lines), distanceMiles: dist, lat, lon });
    } else {
      const s = stationMap.get(name);
      lines.forEach((l) => s.lines.add(l));
      if (dist < s.distanceMiles) s.distanceMiles = dist;
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

  const busStopMap = new Map();
  for (const stop of rawBusStops) {
    if (!busStopMap.has(stop.name)) {
      busStopMap.set(stop.name, { ...stop, routes: new Set(stop.routes) });
    } else {
      const existing = busStopMap.get(stop.name);
      stop.routes.forEach((r) => existing.routes.add(r));
      if (stop.distanceMiles < existing.distanceMiles) existing.distanceMiles = stop.distanceMiles;
    }
  }

  const busStops = [...busStopMap.values()]
    .map((s) => ({ ...s, routes: [...s.routes].sort() }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, 5);

  return { trainStops, busStops };
}
