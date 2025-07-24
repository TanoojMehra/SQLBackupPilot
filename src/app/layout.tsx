import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from './ThemeProvider';
import { initializeApp } from '@/lib/app-init';

export const metadata: Metadata = {
  title: 'SQLBackupPilot',
  description: 'Modernized Next.js Dashboard',
};

// Initialize the app when the module loads (server-side)
if (typeof window === 'undefined') {
  initializeApp();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
