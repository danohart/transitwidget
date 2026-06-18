import "dotenv/config";
import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { initBusCache } from "./services/busCache.js";
import venuesRouter from "./routes/venues.js";
import nearbyRouter from "./routes/nearby.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDb();

initBusCache();

app.use("/api/venues", venuesRouter);
app.use("/api/nearby", nearbyRouter);

app.use("/widget.js", express.static(join(ROOT, "widget/dist/widget.js")));

app.use("/", express.static(join(ROOT, "dashboard")));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Transit Widget API running on http://localhost:${PORT}`);
});
