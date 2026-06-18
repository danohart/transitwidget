import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { geocodeAddress } from '../services/geocode.js';

const router = Router();

/**
 * POST /api/venues
 * Body: { name: string, address: string }
 * Returns: { siteKey, embedSnippet }
 */
router.post('/', async (req, res) => {
  const { name, address } = req.body ?? {};

  if (!name || !address) {
    return res.status(400).json({ error: 'name and address are required' });
  }

  let lat, lon;
  try {
    ({ lat, lon } = await geocodeAddress(address));
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }

  const siteKey = uuidv4();
  const db = getDb();

  db.prepare(
    `INSERT INTO venues (site_key, name, address, lat, lon, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(siteKey, name, address, lat, lon, Date.now());

  const host = `${req.protocol}://${req.get('host')}`;
  const embedSnippet =
    `<script src="${host}/widget.js" data-site-key="${siteKey}" data-api="${host}"></script>`;

  res.json({ siteKey, embedSnippet, lat, lon });
});

/**
 * GET /api/venues
 * List all registered venues (for the dashboard).
 */
router.get('/', (_req, res) => {
  const venues = getDb()
    .prepare('SELECT site_key, name, address, created_at FROM venues ORDER BY created_at DESC')
    .all();
  res.json(venues);
});

export default router;
