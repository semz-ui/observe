import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/shared/layout/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'observe',
  description: 'Product analytics for the observe API',
};

/**
 * Deliberately thin: html, fonts, theme. The chrome lives in the `(dashboard)`
 * group's layout so that M7's login page — which sits outside that group — gets
 * no sidebar without anyone having to refactor this file.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      // next-themes writes the class onto <html> before React hydrates, so the
      // server and client markup differ here by design.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
