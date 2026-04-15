import raw from './tokens.json';

export const tokens = raw;

export type Tokens = typeof raw;

export const px = (n: number) => n;
