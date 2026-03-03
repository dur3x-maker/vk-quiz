import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ReconnectBanner } from '@/components/common/reconnect-banner';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'VK Quiz - Realtime Quiz Platform',
  description: 'Create and play interactive quizzes in real-time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-100/40`}>
        <Providers>
          <ReconnectBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
