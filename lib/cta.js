// CTA API service.
// Uses environment variables:
//   CTA_TRAIN_API  — Train Tracker API key
//   CTA_BUS_API    — Bus Tracker API key

const TRAIN_API_KEY = process.env.CTA_TRAIN_API;
const BUS_API_KEY   = process.env.CTA_BUS_API;

// CTA line key → display name + brand color
export const CTA_LINES = {
  red:  { name: 'Red',            color: '#c60c30' },
  blue: { name: 'Blue',           color: '#00a1de' },
  g:    { name: 'Green',          color: '#009b3a' },
  brn:  { name: 'Brown',          color: '#62361b' },
  p:    { name: 'Purple',         color: '#522398' },
  pexp: { name: 'Purple Express', color: '#522398' },
  y:    { name: 'Yellow',         color: '#f9e300' },
  pnk:  { name: 'Pink',           color: '#e27ea6' },
  o:    { name: 'Orange',         color: '#f9461c' },
};

// --- Spatial query via Chicago Open Data (Socrata) ---

/**
 * Fetch train stops within radiusMeters of a lat/lon.
 * Returns raw Socrata rows with line boolean columns (red, blue, g, …).
 */
export async function getTrainStopsNear(lat, lon, radiusMeters = 800) {
  const url =
    `https://data.cityofchicago.org/resource/8pix-ypme.json` +
    `?$where=within_circle(location,${lat},${lon},${radiusMeters})`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Socrata train stops error: ${res.status}`);
  return res.json();
}

// --- CTA Bus Tracker API (used by seed script) ---

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
