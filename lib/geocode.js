/**
 * Geocode a street address to {lat, lon} using Nominatim (OpenStreetMap).
 * Free, no API key required. Rate limit: 1 req/sec — acceptable since we
 * geocode once per venue and cache the result in Postgres.
 */
export async function geocodeAddress(address) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'transitwidget/1.0 (contact@transitwidget.com)' },
  });

  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);

  const results = await res.json();
  if (!results.length) throw new Error(`Address not found: "${address}"`);

  const { lat, lon } = results[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}
