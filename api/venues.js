import { v4 as uuidv4 } from "uuid";
import sql from "../lib/db.js";
import { geocodeAddress } from "../lib/geocode.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "POST") {
    const { name, address } = req.body ?? {};

    if (!name || !address) {
      return res.status(400).json({ error: "name and address are required" });
    }

    let lat, lon;
    try {
      ({ lat, lon } = await geocodeAddress(address));
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }

    const siteKey = uuidv4();

    await sql`
      INSERT INTO venues (site_key, name, address, lat, lon, created_at)
      VALUES (${siteKey}, ${name}, ${address}, ${lat}, ${lon}, ${Date.now()})`;

    const host = `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host}`;
    const embedSnippet = `<script src="${host}/widget.js" data-site-key="${siteKey}"></script>`;

    return res.status(200).json({ siteKey, embedSnippet, lat, lon });
  }

  if (req.method === "GET") {
    const venues = await sql`
      SELECT site_key, name, address, created_at
      FROM venues
      ORDER BY created_at DESC`;
    return res.status(200).json(venues);
  }

  res.status(405).json({ error: "Method not allowed" });
}
