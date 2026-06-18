import { Router } from 'express';
import { getDb } from '../db.js';
import { findNearbyStops } from '../services/nearby.js';

const router = Router();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * GET /api/nearby/:siteKey
 * Returns nearby train and bus stops for a registered venue.
 * Results are cached for 24 hours (transit stop locations rarely change).
 */
router.get('/:siteKey', async (req, res) => {
  const { siteKey } = req.params;
  const db = getDb();

  // Look up venue
  const venue = db.prepare('SELECT * FROM venues WHERE site_key = ?').get(siteKey);
  if (!venue) {
    return res.status(404).json({ error: 'Venue not found' });
  }

  // Check cache
  const cached = db.prepare('SELECT * FROM stop_cache WHERE site_key = ?').get(siteKey);
  if (cached && Date.now() - cached.cached_at < CACHE_TTL_MS) {
    return res.json(JSON.parse(cached.data));
  }

  // Fetch fresh data
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

  // Upsert cache
  db.prepare(
    `INSERT INTO stop_cache (site_key, data, cached_at) VALUES (?, ?, ?)
     ON CONFLICT(site_key) DO UPDATE SET data = excluded.data, cached_at = excluded.cached_at`
  ).run(siteKey, JSON.stringify(payload), Date.now());

  res.json(payload);
});

export default router;
