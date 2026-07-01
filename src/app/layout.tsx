import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LLB — Learn Bulgarian', description: 'English to Bulgarian flashcards with spaced repetition.', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'LLB' } };
export const viewport: Viewport = { themeColor: '#7f1d1d', width: 'device-width', initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
