import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Windflow — Live Wind Map', description: 'Explore animated wind flow and current weather conditions around the world.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
