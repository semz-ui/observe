'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * next-themes writes the `dark` class onto <html> before first paint via an
 * inline script, which is what stops the light-mode flash. globals.css:5
 * already defines the matching variant (`@custom-variant dark (&:is(.dark *))`),
 * so `attribute="class"` is the only wiring the token set needs.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
