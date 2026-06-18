# TransitWidget

An embeddable widget that shows visitors how to reach your Chicago venue by CTA — automatically, with no typing required.

Paste one `<script>` tag on your website. Visitors instantly see the nearest L stations and bus stops, complete with line colors and walking distance.

```
┌─────────────────────────────────────┐
│ 🚇 Get here by transit              │
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

1. A venue owner registers their address at the dashboard → gets a unique `site-key`
2. They paste one `<script>` tag into their website HTML
3. The widget fetches nearby CTA stops from the backend (cached 24 hrs) and renders inline
4. Visitors see transit options on page load — zero interaction required

**Data sources (no per-request cost)**
- L stops & lines: [Chicago Open Data Portal](https://data.cityofchicago.org/resource/8pix-ypme.json) (Socrata spatial query)
- Bus stops: [Chicago Open Data Portal](https://data.cityofchicago.org/resource/d5bx-dr8z.json)
- Geocoding: [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) (free, no key)
- Real-time arrivals (optional): CTA Train Tracker + Bus Tracker APIs

---

## Project structure

```
transitwidget/
├── backend/          # Node/Express API server
│   ├── src/
│   │   ├── index.js            # Server entry point
│   │   ├── db.js               # SQLite setup
│   │   ├── routes/
│   │   │   ├── venues.js       # POST /api/venues, GET /api/venues
│   │   │   └── nearby.js       # GET /api/nearby/:siteKey
│   │   └── services/
│   │       ├── cta.js          # CTA API + Chicago Open Data queries
│   │       ├── geocode.js      # Nominatim geocoding
│   │       └── nearby.js       # Distance calc + stop formatting
│   ├── .env.example
│   └── package.json
│
├── widget/           # Embeddable vanilla JS widget
│   ├── src/
│   │   └── widget.js           # Source (no framework, no dependencies)
│   ├── dist/
│   │   └── widget.js           # Built/minified output (serve this)
│   └── package.json
│
└── dashboard/        # Venue registration UI
    └── index.html    # Single-page form → generates embed snippet
```

---

## Setup

### Prerequisites

- Node.js 18+
- CTA API keys (free) — register at [transitchicago.com/developers](https://www.transitchicago.com/developers/)

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
CTA_TRAIN_API=your_train_tracker_key
CTA_BUS_API=your_bus_tracker_key
PORT=3000
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../widget && npm install
```

### 3. Build the widget

```bash
cd widget
npm run build        # produces widget/dist/widget.js
```

For development with auto-rebuild on save:

```bash
npm run dev
```

### 4. Start the backend

```bash
cd backend
npm start            # production
npm run dev          # auto-restarts on file changes (Node 18+)
```

The API runs at `http://localhost:3000`.

### 5. Open the dashboard

Open `dashboard/index.html` in a browser (or serve it statically alongside the backend). Enter a venue name and Chicago address to generate an embed snippet.

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

List all registered venues (used by the dashboard).

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

### Self-hosted backend

If you're running the backend somewhere other than `transitwidget.com`, point the widget at it:

```html
<script
  src="https://your-domain.com/widget.js"
  data-site-key="a1b2c3d4-..."
  data-api="https://api.your-domain.com"
></script>
```

The widget inserts itself immediately after the `<script>` tag in the DOM, so placement is intentional — put the tag wherever you want the widget to appear on the page.

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

## Deployment notes

- Serve `widget/dist/widget.js` as a static file from your backend or a CDN
- The SQLite database file (`transitwidget.db`) is created automatically on first run in the project root
- Stop cache TTL is 24 hours — transit stop locations rarely change, so this is safe
- Nominatim geocoding is called once per venue registration and the result is stored; no ongoing cost or rate-limit exposure
- For production, put the backend behind a reverse proxy (nginx/Caddy) with HTTPS and serve the widget JS with aggressive cache headers (`Cache-Control: public, max-age=86400`)
