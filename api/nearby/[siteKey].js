import sql from '../../lib/db.js';
import { findNearbyStops } from '../../lib/nearby.js';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { siteKey } = req.query;

  const [venue] = await sql`SELECT * FROM venues WHERE site_key = ${siteKey}`;
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  const [cached] = await sql`SELECT * FROM stop_cache WHERE site_key = ${siteKey}`;
  if (cached && Date.now() - Number(cached.cached_at) < CACHE_TTL_MS) {
    return res.status(200).json(JSON.parse(cached.data));
  }

  let stopData;
  try {
    stopData = await findNearbyStops(venue.lat, venue.lon);
  } catch (err) {
    console.error('findNearbyStops error:', err);
    return res.status(502).json({ error: 'Failed to fetch transit data' });
  }

  const payload = {
    venueName: venue.name,
    address: venue.address,
    ...stopData,
  };

  await sql`
    INSERT INTO stop_cache (site_key, data, cached_at)
    VALUES (${siteKey}, ${JSON.stringify(payload)}, ${Date.now()})
    ON CONFLICT (site_key)
    DO UPDATE SET data = EXCLUDED.data, cached_at = EXCLUDED.cached_at`;

  return res.status(200).json(payload);
}
