# Windflow Studio — Animated Wind Map

A responsive Next.js + TypeScript weather-map frontend with Leaflet, animated wind particles, a polished dark dashboard, city search, and current weather from Open-Meteo. No Supabase or API key is required.

## Run locally

1. Install Node.js 20.9+.
2. Run npm install.
3. Run npm run dev.
4. Open http://localhost:3000.

## Deploy

Import this repository into Vercel. No environment variables are required.

## Important limitations

- Current speed, direction, temperature and humidity come from Open-Meteo for the selected location.
- Particle animation uses the selected location's prevailing wind direction and speed as a stylized flow across the map. It is not yet a geographically accurate global wind simulation.
- The timeline is a UI preview and does not yet load future wind fields.
- Map tiles use CARTO with OpenStreetMap data. Review provider usage and attribution conditions before high-traffic or commercial use.
