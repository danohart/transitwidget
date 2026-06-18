// CTA API service — adapted from existing CTA integration.
// Uses environment variables set in .env:
//   CTA_TRAIN_API  — Train Tracker API key
//   CTA_BUS_API    — Bus Tracker API key

const TRAIN_API_KEY = process.env.CTA_TRAIN_API;
const BUS_API_KEY   = process.env.CTA_BUS_API;

const TRAIN_API_URL = `https://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=${TRAIN_API_KEY}`;
const BUS_API_URL   = `http://ctabustracker.com/bustime/api/v2/getpredictions?key=${BUS_API_KEY}`;

// CTA line key → display name + brand color
export const CTA_LINES = {
  red:  { name: 'Red',    color: '#c60c30' },
  blue: { name: 'Blue',   color: '#00a1de' },
  g:    { name: 'Green',  color: '#009b3a' },
  brn:  { name: 'Brown',  color: '#62361b' },
  p:    { name: 'Purple', color: '#522398' },
  pexp: { name: 'Purple Express', color: '#522398' },
  y:    { name: 'Yellow', color: '#f9e300' },
  pnk:  { name: 'Pink',  color: '#e27ea6' },
  o:    { name: 'Orange', color: '#f9461c' },
};

// --- Spatial queries via Chicago Open Data (Socrata) ---

/**
 * Fetch train stops within radiusMeters of a lat/lon.
 * Returns raw Socrata rows (stop_name, station_name, location, red, blue, g, …).
 */
export async function getTrainStopsNear(lat, lon, radiusMeters = 800) {
  const url =
    `https://data.cityofchicago.org/resource/8pix-ypme.json` +
    `?$where=within_circle(location,${lat},${lon},${radiusMeters})`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Socrata train stops error: ${res.status}`);
  return res.json();
}

// getBusStopsNear is now handled by busCache.js (SQLite query).
// This stub is kept so old imports don't break during transition.
export async function getBusStopsNear() {
  throw new Error('Use queryBusStopsNear() from busCache.js instead');
}

// --- Real-time arrivals (existing integration) ---

export async function getTrains(stationNumber) {
  return fetch(`${TRAIN_API_URL}&stpid=${stationNumber}&outputType=JSON`);
}

export async function getTrainStops(route) {
  return fetch(
    `https://data.cityofchicago.org/resource/8pix-ypme.json?$query=SELECT%0A%20%20%60stop_id%60%2C%0A%20%20%60direction_id%60%2C%0A%20%20%60stop_name%60%2C%0A%20%20%60station_name%60%2C%0A%20%20%60station_descriptive_name%60%2C%0A%20%20%60map_id%60%2C%0A%20%20%60ada%60%2C%0A%20%20%60red%60%2C%0A%20%20%60blue%60%2C%0A%20%20%60g%60%2C%0A%20%20%60brn%60%2C%0A%20%20%60p%60%2C%0A%20%20%60pexp%60%2C%0A%20%20%60y%60%2C%0A%20%20%60pnk%60%2C%0A%20%20%60o%60%2C%0A%20%20%60location%60%0AWHERE%20%60${route}%60%20%3D%3D%20TRUE%0AORDER%20BY%20%60station_name%60%20ASC%20NULL%20LAST`
  );
}

export async function getTrainLocations(route) {
  return fetch(
    `https://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=${TRAIN_API_KEY}&rt=${route}&outputType=JSON`
  );
}

export async function getBuses(routeNumber, stopNumber) {
  return fetch(`${BUS_API_URL}&rt=${routeNumber}&stpid=${stopNumber}&format=json`);
}

export async function getBusRoutes() {
  return fetch(
    `http://ctabustracker.com/bustime/api/v2/getroutes?key=${BUS_API_KEY}&format=json`
  );
}

export async function getSelectedBusDirection(selectedRoute) {
  return fetch(
    `http://ctabustracker.com/bustime/api/v2/getdirections?key=${BUS_API_KEY}&rt=${selectedRoute}&format=json`
  );
}

export async function getSelectedBusStops(selectedRoute, selectedDirection) {
  return fetch(
    `http://ctabustracker.com/bustime/api/v2/getstops?key=${BUS_API_KEY}&rt=${selectedRoute}&dir=${selectedDirection}&format=json`
  );
}

export async function getSelectedBusPredictions(selectedRoute, selectedStop) {
  return fetch(
    `http://ctabustracker.com/bustime/api/v2/getpredictions?key=${BUS_API_KEY}&rt=${selectedRoute}&stpid=${selectedStop}&format=json`
  );
}
