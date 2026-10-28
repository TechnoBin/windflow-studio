# Windflow Studio — India Wind Map

A responsive Next.js + TypeScript weather-map website with real map tiles, animated wind particles, local-time hourly forecasts, city search, and weather data from Open-Meteo. No Supabase or API key is required.

## Features
- India-focused map starting near Bhubaneswar, with Dark, Street and Satellite basemap options.
- Search Indian cities including Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad, Jaipur, Lucknow, Guwahati and Kochi.
- Hourly forecast aligned to the selected location's local timezone; the first card marks the current hour, followed by the next 23 hours.
- Wind speed/direction, temperature, humidity, wind gust estimates and hourly precipitation probability.
- km/h and m/s units, animated-flow pause/resume, refresh every 15 minutes, and responsive desktop/mobile layout.

## Run locally
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open http://localhost:3000.

## Deploy
Import this repository into Vercel. No environment variables are required.

## Data notes
- Current and hourly weather data are served by Open-Meteo for the selected coordinates.
- The map tiles are real geographic basemaps (OpenStreetMap/CARTO and Esri imagery), not a custom illustration.
- Animated particles remain a stylized visualization driven by the selected location's wind direction and speed; they are not a physically accurate, gridded wind simulation for all of India.
- Map tile providers have their own attribution, fair-use and commercial-use terms; review them before high-traffic or commercial deployment.
