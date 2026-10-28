import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RawPoint = Record<string, unknown>;

function normalizePoint(point: RawPoint, type: 'observed' | 'forecast') {
  const rawTime = String(point['Date/Time'] ?? point.dateTime ?? point.datetime ?? '');
  const match = rawTime.match(/^(\d{2})\.(\d{2})\.(\d{2,4})\/(\d{2,4})$/);
  let validTime = '';
  if (match) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    validTime = `${year}-${match[2]}-${match[1]}T${match[4].slice(0, 2)}:${match[4].slice(2, 4)}:00+05:30`;
  } else if (rawTime) {
    validTime = rawTime;
  }
  const lat = Number(point.lat ?? point.latitude);
  const lon = Number(point.lon ?? point.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !validTime) return null;
  return {
    name: String(point.CYCLONE_NAME ?? point.cyclone_name ?? point.name ?? 'Cyclonic system'),
    validTime,
    date: validTime.slice(0, 10),
    lat,
    lon,
    windSpeed: String(point['Mean MSW (kmph)'] ?? point['MSW range (kmph)'] ?? point.wind_speed ?? ''),
    category: String(point.Category ?? point.category ?? ''),
    type,
  };
}

export async function GET() {
  try {
    const response = await fetch('https://api.imd.gov.in/api/v1/cyclone_track', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return NextResponse.json({
        available: false,
        message: `IMD cyclone track feed returned HTTP ${response.status}.`,
        updatedAt: new Date().toISOString(),
        points: [],
      }, { status: 200 });
    }
    const payload = await response.json();
    const data = payload?.data ?? {};
    const observed = Array.isArray(data.observed) ? data.observed : [];
    const forecast = Array.isArray(data.forecast) ? data.forecast : [];
    const points = [
      ...observed.map((point: RawPoint) => normalizePoint(point, 'observed')),
      ...forecast.map((point: RawPoint) => normalizePoint(point, 'forecast')),
    ].filter(Boolean);
    return NextResponse.json({
      available: payload?.status !== false,
      message: points.length ? 'Official IMD cyclone track data received.' : 'The official track feed returned no usable track points.',
      updatedAt: new Date().toISOString(),
      points,
    }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch {
    return NextResponse.json({
      available: false,
      message: 'Official IMD cyclone track data is temporarily unavailable.',
      updatedAt: new Date().toISOString(),
      points: [],
    }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
}
