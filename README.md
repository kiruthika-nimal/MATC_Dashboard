# MetroPulse Accessible Transit Command (MATC)

An offline-friendly government/transit authority monitoring dashboard for BusSaathi. Passenger guidance remains fully offline; MATC is an optional, anonymized, opt-in monitoring layer.

## Setup

```bash
npm install
npm run dev
```

Built with Vite, React, TypeScript, Tailwind CSS, Recharts, and lucide-react. All data is simulated in the browser; there is no backend or external map tile dependency.

## Panels

1. KPI strip with live mini trends.
2. Assisted boarding radar with anonymous requests and driver alerts.
3. Live stop SVG schematic and detected bus table.
4. Signal inspector with raw and smoothed BLE RSSI.
5. Beacon fleet health and predictive battery note.
6. Human-in-the-loop incident workflow with evidence review.
7. Accessibility equity heatmap and suggested installs.
8. Announcement dispatcher with SpeechSynthesis preview.
9. CSV monthly compliance report export.

The **Run Demo Scenario** control plays a scripted boarding story and can be paused/reset.

## How to connect real hardware

ESP32 beacons on buses/stops send anonymized telemetry to a local ESP32 hub or gateway over Wi-Fi. Replace the simulator update loop in `src/App.tsx` with an adapter for an MQTT subscription or Socket.io/WebSocket feed. Keep the same typed models and map incoming messages to requests, signal readings, fleet health, incidents, and bus detections. The passenger app and beacon guidance path should remain offline-first.
