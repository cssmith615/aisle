import React, { createContext, useContext } from 'react';
import { useEventStore } from '../store/eventStore';
import { getPalette, Palette, DEFAULT_PALETTE } from '../theme/palettes';

const ThemeContext = createContext<Palette>(DEFAULT_PALETTE);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { events, activeEventId } = useEventStore();
  const activeEvent = events.find(e => e.id === activeEventId);
  const palette = getPalette((activeEvent as any)?.theme_palette);

  return (
    <ThemeContext.Provider value={palette}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Palette {
  return useContext(ThemeContext);
}
