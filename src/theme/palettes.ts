export interface Palette {
  id: string;
  name: string;
  primary: string;
  primaryDark: string;
  gradient: [string, string];
  preview: string[]; // swatch colors shown in picker
}

export const PALETTES: Palette[] = [
  {
    id: 'gold',
    name: 'Classic Gold',
    primary: '#C9A96E',
    primaryDark: '#A07840',
    gradient: ['#C9A96E', '#A07840'],
    preview: ['#C9A96E', '#A07840', '#F5ECD7'],
  },
  {
    id: 'dusty_rose',
    name: 'Dusty Rose',
    primary: '#C47B7B',
    primaryDark: '#A05C5C',
    gradient: ['#D4897A', '#B56B5C'],
    preview: ['#D4897A', '#B56B5C', '#F5E0DC'],
  },
  {
    id: 'sage',
    name: 'Sage Garden',
    primary: '#7A9E7E',
    primaryDark: '#5A7D5E',
    gradient: ['#7A9E7E', '#5A7D5E'],
    preview: ['#7A9E7E', '#5A7D5E', '#E0EDE1'],
  },
  {
    id: 'navy',
    name: 'Navy & Gold',
    primary: '#2C4A7C',
    primaryDark: '#1A3060',
    gradient: ['#2C4A7C', '#1A3060'],
    preview: ['#2C4A7C', '#1A3060', '#C9A96E'],
  },
  {
    id: 'lavender',
    name: 'Lavender Dreams',
    primary: '#9B7EC8',
    primaryDark: '#7A5CAD',
    gradient: ['#9B7EC8', '#7A5CAD'],
    preview: ['#9B7EC8', '#7A5CAD', '#EDE4F5'],
  },
  {
    id: 'blush',
    name: 'Blush Pink',
    primary: '#D4889A',
    primaryDark: '#B56676',
    gradient: ['#E8A0B0', '#C87888'],
    preview: ['#E8A0B0', '#C87888', '#F9E8EC'],
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    primary: '#C4704A',
    primaryDark: '#A05030',
    gradient: ['#C4704A', '#A05030'],
    preview: ['#C4704A', '#A05030', '#F5E0D6'],
  },
  {
    id: 'slate',
    name: 'Slate Blue',
    primary: '#607B8B',
    primaryDark: '#445D6E',
    gradient: ['#607B8B', '#445D6E'],
    preview: ['#607B8B', '#445D6E', '#DDE6ED'],
  },
  {
    id: 'champagne',
    name: 'Champagne',
    primary: '#C4A882',
    primaryDark: '#A08860',
    gradient: ['#D4B896', '#B09070'],
    preview: ['#D4B896', '#B09070', '#F5EDE0'],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primary: '#4A8C6F',
    primaryDark: '#2D6E53',
    gradient: ['#4A8C6F', '#2D6E53'],
    preview: ['#4A8C6F', '#2D6E53', '#D6EDE5'],
  },
];

export const DEFAULT_PALETTE = PALETTES[0];

export function getPalette(id: string | null | undefined): Palette {
  return PALETTES.find(p => p.id === id) ?? DEFAULT_PALETTE;
}
