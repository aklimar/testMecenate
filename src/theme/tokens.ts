import raw from './tokens.json';

/** Литеральные веса для `StyleSheet` / сегментов (из JSON приходил бы `string`) */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  caption: {
    fontSize: raw.font.sm,
    lineHeight: raw.lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  captionMedium: {
    fontSize: raw.font.sm,
    lineHeight: raw.lineHeight.sm,
    fontWeight: fontWeight.medium,
  },
  captionSemibold: {
    fontSize: raw.font.sm,
    lineHeight: raw.lineHeight.sm,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: raw.font.base,
    lineHeight: raw.lineHeight.base,
    fontWeight: fontWeight.regular,
  },
  bodySemibold: {
    fontSize: raw.font.base,
    lineHeight: raw.lineHeight.base,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: raw.font.xl,
    lineHeight: raw.lineHeight.tightLg,
    fontWeight: fontWeight.bold,
  },
  titleLgBold: {
    fontSize: raw.font.lg,
    lineHeight: raw.lineHeight.lg,
    fontWeight: fontWeight.bold,
  },
  heroTitle: {
    fontSize: raw.font['2xl'],
    lineHeight: raw.lineHeight['2xl'],
    fontWeight: fontWeight.bold,
  },
} as const;

export const tokens = { ...raw, fontWeight, typography };
export type Tokens = typeof tokens;

type ColorKey = keyof (typeof raw)['color'];
type SpaceKey = keyof (typeof raw)['space'];
type RadiusKey = keyof (typeof raw)['radius'];
type FontKey = keyof (typeof raw)['font'];
type LineHeightKey = keyof (typeof raw)['lineHeight'];
type FontWeightKey = keyof typeof fontWeight;
type TypographyKey = keyof typeof typography;

export const c = (k: ColorKey) => tokens.color[k];
export const s = (k: SpaceKey) => tokens.space[k];
export const r = (k: RadiusKey) => tokens.radius[k];
export const f = (k: FontKey) => tokens.font[k];
export const lh = (k: LineHeightKey) => tokens.lineHeight[k];
export const fw = (k: FontWeightKey) => tokens.fontWeight[k];
export const text = (k: TypographyKey) => tokens.typography[k];

export type { ColorKey, SpaceKey, RadiusKey, FontKey, LineHeightKey, FontWeightKey, TypographyKey };
