# MetroPulse Accessible Transit Command (MATC)

An offline-friendly government/transit authority monitoring dashboard for BusSaathi. Passenger guidance remains fully offline; MATC is an optional, anonymized, opt-in monitoring layer. All demo data is clearly simulated.

## Setup

```bash
npm install
npm run dev
```

Built with Vite, React, TypeScript, Tailwind CSS, Recharts, lucide-react, Leaflet, React Leaflet, React Router, and Zustand. OpenStreetMap tiles are used when available; tile failures are handled with a non-blocking offline banner while simulated GPS markers continue to work.

## Pages

- **Overview**: KPI strip, compact fleet map, top assistance requests, incidents, and fleet health.
- **Live GPS Map**: Chennai OSM map with 30 simulated buses, six route polylines, route/status filters, stop geofences, assistance pins, selectable buses, breadcrumbs, follow mode, and offline tile fallback.
- **Assisted Boarding**: Anonymous opt-in requests and driver alerts.
- **Fleet & GPS**: Searchable keyboard-accessible equivalent of the map.
- **Signal Inspector**: Live raw/smoothed BLE RSSI plus GPS-to-BLE last-meter handoff.
- **Beacon Health**: Battery and last-seen monitoring.
- **Incidents**: Open / Assigned / Resolved human-in-the-loop workflow.
- **Equity Heatmap**: Separate static historical score map with 7/30/90-day range selection, score breakdowns, install recommendations, and before/after upgrades. It intentionally has no moving buses or live GPS.
- **Announcements**: Multilingual broadcast dispatcher with speech preview.
- **Reports**: CSV download and printable report view.

The **Run Demo Scenario** control navigates to the live map and keeps the scripted boarding story, captions, pause, and reset controls visible across pages.

## Connecting real GPS

The simulator publishes through the same typed Zustand store interface used by the pages. Replace the simulator tick with either:

- **Option A — GPS module**: Add a GPS module such as a u-blox NEO-6M to the bus ESP32, use a Wi-Fi/cellular uplink, and publish JSON over MQTT:

  ```json
  { "busId": "BUS-23C-04", "lat": 13.0067, "lng": 80.2206, "speedKmh": 24, "headingDeg": 90, "ts": 1728470000 }
  ```

- **Option B — existing fleet feed**: Reuse the transit authority’s fleet GPS or GTFS-realtime feed.

Both options should map incoming messages to the existing `BusGps`, `Stop`, `RouteDef`, and incident models. Passenger BLE guidance remains offline-first and is not dependent on GPS availability.
