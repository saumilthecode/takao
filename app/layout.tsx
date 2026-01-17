/**
 * ============================================================
 * 📄 FILE: frontend/app/layout.tsx
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Root layout for the Next.js app.
 *    Wraps all pages with global styles and providers.
 * 
 * 🛠️ TECH USED:
 *    - Next.js 14 App Router
 *    - Tailwind CSS (global styles)
 *    - Inter font (Google Fonts)
 * 
 * ============================================================
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Takoa - Find Your People',
  description: 'University friend-matching with 3D vector visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
