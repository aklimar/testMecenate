const t = require('./src/theme/tokens.json');

const spacing = Object.fromEntries(
  Object.entries(t.space).map(([key, value]) => [key, `${value}px`])
);

const borderRadius = Object.fromEntries(
  Object.entries(t.radius).map(([key, value]) => [key, `${value}px`])
);

const fontSize = Object.fromEntries(
  Object.entries(t.font).map(([key, value]) => {
    const size = `${value}px`;
    const line = `${Math.round(Number(value) * 1.45)}px`;
    return [key, [size, { lineHeight: line }]];
  })
);

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: t.color.primary,
        primaryForeground: t.color.primaryForeground,
        secondary: t.color.secondary,
        background: t.color.background,
        surface: t.color.surface,
        foreground: t.color.foreground,
        muted: t.color.muted,
        mutedForeground: t.color.mutedForeground,
        segmentInactive: t.color.segmentInactive,
        pillBackground: t.color.pillBackground,
        pillForeground: t.color.pillForeground,
        border: t.color.border,
        accent: t.color.accent,
        danger: t.color.danger,
        success: t.color.success,
      },
      spacing,
      borderRadius,
      fontSize,
    },
  },
  plugins: [],
};
