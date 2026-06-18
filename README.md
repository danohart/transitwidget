# TransitWidget

An embeddable widget that shows visitors how to reach your Chicago venue by CTA — automatically, with no typing required.

Paste one `<script>` tag on your website. Visitors instantly see the nearest L stations and bus stops, complete with line colors and walking distance.

```
┌─────────────────────────────────────┐
│ 🚆 Get here by transit              │
├─────────────────────────────────────┤
│ L TRAIN                             │
│ ● Damen (Blue Line)  · 0.2 mi      │
│   [Blue]                            │
│                                     │
│ ● Division  · 0.4 mi               │
│   [Blue]                            │
│                                     │
│ BUS                                 │
│ ● Damen & North  · 0.1 mi          │
│   [50] [72]                         │
└─────────────────────────────────────┘
```

---

## How it works

1. A venue owner registers their address at `/` → gets a unique `site-key`
2. They paste one `<script>` tag into their website HTML
3. The widget fetches nearby CTA stops from the API (cached 24 hrs) and renders inline
4. Visitors see transit options on page load — zero interaction required

**Data sources (no per-request cost)**
- L stops & lines: [Chicago Open Data Portal](https://data.cityofchicago.org/resource/8pix-ypme.json) (Socrata spatial query)
- Bus stops: seeded from CTA Bus Tracker API into Neon Postgres
- Geocoding: [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) (free, no key)

---

## Project structure

```
transitwidget/
├── api/
│   ├── venues.js               # POST /api/venues, GET /api/venues
│   └── nearby/
│       └── [siteKey].js        # GET /api/nearby/:siteKey
│
├── lib/
│   ├── db.js                   # Neon Postgres client + schema init
│   ├── cta.js                  # CTA line definitions + Open Data queries
│   ├── geocode.js              # Nominatim geocoding
│   ├── busCache.js             # Bus stop spatial queries
│   └── nearby.js               # Stop aggregation + distance calc
│
├── widget/
│   └── src/
│       └── widget.js           # Widget source (no framework, no dependencies)
│
├── public/
│   ├── index.html              # Venue registration UI
│   └── widget.js               # Built/minified widget (output of npm run build)
│
├── scripts/
│   └── seed-bus-stops.js       # One-time bus stop seeder
│
├── vercel.json
└── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- CTA API keys (free) — register at [transitchicago.com/developers](https://www.transitchicago.com/developers/)
- A [Neon](https://neon.tech) Postgres database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```
DATABASE_URL=postgresql://...
CTA_TRAIN_API=your_train_tracker_key
CTA_BUS_API=your_bus_tracker_key
```

### 3. Seed bus stops

Run once before first use (takes ~90 seconds):

```bash
npm run seed
```

### 4. Build the widget

```bash
npm run build        # outputs public/widget.js
```

### 5. Run locally

```bash
vercel dev
```

The app runs at `http://localhost:3000`. The registration UI is at `/`.

---

## API reference

### `POST /api/venues`

Register a new venue. Geocodes the address and returns an embed snippet.

**Request body:**
```json
{
  "name": "The Hideout",
  "address": "1354 W Wabansia Ave, Chicago, IL"
}
```

**Response:**
```json
{
  "siteKey": "a1b2c3d4-...",
  "embedSnippet": "<script src=\"https://transitwidget.com/widget.js\" data-site-key=\"a1b2c3d4-...\"></script>",
  "lat": 41.9117,
  "lon": -87.6559
}
```

---

### `GET /api/nearby/:siteKey`

Returns nearby transit stops for a registered venue. Cached for 24 hours.

**Response:**
```json
{
  "venueName": "The Hideout",
  "address": "1354 W Wabansia Ave, Chicago, IL",
  "trainStops": [
    {
      "name": "Damen",
      "lines": [
        { "key": "blue", "name": "Blue", "color": "#00a1de" }
      ],
      "distanceMiles": 0.2,
      "lat": 41.9097,
      "lon": -87.6779
    }
  ],
  "busStops": [
    {
      "name": "Damen & North",
      "stopId": "14322",
      "routes": ["50", "72"],
      "distanceMiles": 0.1,
      "lat": 41.9106,
      "lon": -87.6779
    }
  ]
}
```

---

### `GET /api/venues`

List all registered venues.

---

## Embed reference

### Basic embed

```html
<script
  src="https://your-domain.com/widget.js"
  data-site-key="a1b2c3d4-..."
></script>
```

### Dark theme

```html
<script
  src="https://your-domain.com/widget.js"
  data-site-key="a1b2c3d4-..."
  data-theme="dark"
></script>
```

### Custom API origin

If your API is on a different domain than the widget JS:

```html
<script
  src="https://your-domain.com/widget.js"
  data-site-key="a1b2c3d4-..."
  data-api="https://api.your-domain.com"
></script>
```

The widget inserts itself immediately after the `<script>` tag in the DOM — place it wherever you want it to appear on the page.

---

## CTA line colors

| Line   | Color     | Key    |
|--------|-----------|--------|
| Red    | `#c60c30` | `red`  |
| Blue   | `#00a1de` | `blue` |
| Green  | `#009b3a` | `g`    |
| Brown  | `#62361b` | `brn`  |
| Purple | `#522398` | `p`    |
| Yellow | `#f9e300` | `y`    |
| Pink   | `#e27ea6` | `pnk`  |
| Orange | `#f9461c` | `o`    |

---

## Deployment

This project is deployed on Vercel. Push to `main` to deploy.

- Static files in `public/` are served at the root
- `api/**/*.js` are deployed as serverless functions
- Run `npm run build` before deploying if you've changed `widget/src/widget.js`
- Bus stop data lives in Neon and does not need to be re-seeded on deploy
