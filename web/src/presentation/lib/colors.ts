/** Runtime color palette for map/chart libraries that require literal color values. */
export const COLORS = {
  GREEN: '#98c33a',
  BLUE: '#004494',
  ORANGE: '#ff632f',
  RED: '#ff3030',
  BLUE_LIGHT: '#75bdfb',
  GRAY: '#606060',
  GRAY_LIGHT: '#dadada',
  WHITE: '#ffffff',
} as const;

export type ColorKey = keyof typeof COLORS;
