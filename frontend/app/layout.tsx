import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/AuthContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { ThemeProvider } from '../lib/ThemeContext';
import TopNav from './components/TopNav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Movie Recommender',
    template: '%s · Movie Recommender',
  },
  description:
    'Personalized movie recommendations that learn from your ratings. Discover trending films, save favorites, and find your next watch.',
  applicationName: 'Movie Recommender',
  authors: [{ name: 'Movie Recommender' }],
  keywords: ['movies', 'recommendations', 'tmdb', 'film', 'favorites'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <TopNav />
              {children}
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
