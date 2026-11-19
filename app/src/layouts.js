// Panel layouts for the cover: each layout is a function of the canvas size
// that returns the photo panels (fractions of width/height, resolved by the
// renderer) and the title zone where the lettering goes. The classic GTA
// cover look is a grid of panels with a bold title band; every layout keeps
// the title clear of the photos so the lettering always reads.

export const LAYOUTS = [
  {
    id: 'classic',
    name: 'Cover Grid',
    blurb: 'The classic multi-panel poster: one hero, five scenes.',
    // Repeats sit far apart: hero and bottom-right share one photo, the
    // right column and bottom-middle share another.
    defaultPhotos: [0, 1, 2, 3, 1, 0],
    panels: (W, H) => [
      { x: 0, y: 0, w: 0.58 * W, h: 0.56 * H },
      { x: 0.58 * W, y: 0, w: 0.42 * W, h: 0.28 * H },
      { x: 0.58 * W, y: 0.28 * H, w: 0.42 * W, h: 0.28 * H },
      { x: 0, y: 0.56 * H, w: 0.29 * W, h: 0.22 * H },
      { x: 0.29 * W, y: 0.56 * H, w: 0.29 * W, h: 0.22 * H },
      { x: 0.58 * W, y: 0.56 * H, w: 0.42 * W, h: 0.22 * H },
    ],
    title: (W, H) => ({ x: 0, y: 0.78 * H, w: W, h: 0.22 * H, band: true }),
  },
  {
    id: 'hero3',
    name: 'Hero + Three',
    blurb: 'One big hero shot, three scenes underneath.',
    defaultPhotos: [0, 1, 2, 3],
    panels: (W, H) => [
      { x: 0, y: 0, w: W, h: 0.6 * H },
      { x: 0, y: 0.6 * H, w: (1 / 3) * W, h: 0.2 * H },
      { x: (1 / 3) * W, y: 0.6 * H, w: (1 / 3) * W, h: 0.2 * H },
      { x: (2 / 3) * W, y: 0.6 * H, w: (1 / 3) * W, h: 0.2 * H },
    ],
    title: (W, H) => ({ x: 0, y: 0.8 * H, w: W, h: 0.2 * H, band: true }),
  },
  {
    id: 'grid4',
    name: 'Four Panel',
    blurb: 'A clean 2 x 2 grid of scenes.',
    defaultPhotos: [0, 1, 2, 3],
    panels: (W, H) => [
      { x: 0, y: 0, w: 0.5 * W, h: 0.39 * H },
      { x: 0.5 * W, y: 0, w: 0.5 * W, h: 0.39 * H },
      { x: 0, y: 0.39 * H, w: 0.5 * W, h: 0.39 * H },
      { x: 0.5 * W, y: 0.39 * H, w: 0.5 * W, h: 0.39 * H },
    ],
    title: (W, H) => ({ x: 0, y: 0.78 * H, w: W, h: 0.22 * H, band: true }),
  },
  {
    id: 'grid6',
    name: 'Six Panel',
    blurb: 'Six scenes in a 3 x 2 grid.',
    // Repeats sit on opposite diagonals, never side by side.
    defaultPhotos: [0, 1, 2, 3, 1, 0],
    panels: (W, H) => [
      { x: 0, y: 0, w: (1 / 3) * W, h: 0.39 * H },
      { x: (1 / 3) * W, y: 0, w: (1 / 3) * W, h: 0.39 * H },
      { x: (2 / 3) * W, y: 0, w: (1 / 3) * W, h: 0.39 * H },
      { x: 0, y: 0.39 * H, w: (1 / 3) * W, h: 0.39 * H },
      { x: (1 / 3) * W, y: 0.39 * H, w: (1 / 3) * W, h: 0.39 * H },
      { x: (2 / 3) * W, y: 0.39 * H, w: (1 / 3) * W, h: 0.39 * H },
    ],
    title: (W, H) => ({ x: 0, y: 0.78 * H, w: W, h: 0.22 * H, band: true }),
  },
  {
    id: 'fullbleed',
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, title over a scrim.',
    defaultPhotos: [0],
    panels: (W, H) => [{ x: 0, y: 0, w: W, h: H }],
    title: (W, H) => ({
      x: 0.05 * W, y: 0.7 * H, w: 0.9 * W, h: 0.26 * H, band: false, scrim: true,
    }),
  },
  {
    id: 'tilted',
    name: 'Snapshot Tilt',
    blurb: 'Three tilted snapshots on a sunset backdrop.',
    defaultPhotos: [0, 1, 2],
    panels: (W, H) => [
      { x: 0.05 * W, y: 0.24 * H, w: 0.42 * W, h: 0.52 * H, rot: -0.1 },
      { x: 0.52 * W, y: 0.2 * H, w: 0.42 * W, h: 0.52 * H, rot: 0.07 },
      { x: 0.28 * W, y: 0.62 * H, w: 0.44 * W, h: 0.3 * H, rot: -0.04 },
    ],
    title: (W, H) => ({ x: 0, y: 0.02 * H, w: W, h: 0.18 * H, band: false }),
  },
];

export function getLayout(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// The export sizes: the common post sizes the bounty names, plus a story size.
export const SIZES = [
  { id: 'square', name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
  { id: 'story', name: 'Story · 1080 × 1920', w: 1080, h: 1920 },
];

export function getSize(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[1];
}
