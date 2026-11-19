// Colour grades: each grade is a canvas filter chain for the photos plus a
// gradient overlay blended over them, a vignette strength and a grain
// amount. The grades are what make a plain photo read as a Vice City sunset
// or a neon night: warm lifted shadows and pink-gold highlights for sunset,
// teal shadows and magenta highlights for neon.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset Strip',
    swatch: ['#ff9a3d', '#ff2d78'],
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03) sepia(0.18)',
    overlay: {
      blend: 'overlay',
      alpha: 0.55,
      stops: [
        [0, '#ff9a3d'],
        [0.55, '#ff5e78'],
        [1, '#7a1fa2'],
      ],
    },
    vignette: 0.32,
    grain: 0.05,
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    swatch: ['#00e5ff', '#ff2d78'],
    filter: 'saturate(1.55) contrast(1.18) brightness(0.98)',
    overlay: {
      blend: 'soft-light',
      alpha: 0.7,
      stops: [
        [0, '#00e5ff'],
        [0.5, '#2b1a5e'],
        [1, '#ff2d78'],
      ],
    },
    vignette: 0.4,
    grain: 0.06,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    swatch: ['#ffd166', '#ff7b00'],
    filter: 'saturate(1.25) brightness(1.07) contrast(1.02) sepia(0.32)',
    overlay: {
      blend: 'soft-light',
      alpha: 0.5,
      stops: [
        [0, '#ffe08a'],
        [1, '#ff7b00'],
      ],
    },
    vignette: 0.25,
    grain: 0.04,
  },
  {
    id: 'midnight',
    name: 'Midnight Drive',
    swatch: ['#0b3d91', '#00c2ff'],
    filter: 'saturate(0.95) contrast(1.15) brightness(0.92)',
    overlay: {
      blend: 'overlay',
      alpha: 0.55,
      stops: [
        [0, '#0b3d91'],
        [1, '#001233'],
      ],
    },
    vignette: 0.45,
    grain: 0.06,
  },
  {
    id: 'noir',
    name: 'Noir',
    swatch: ['#e8e8e8', '#111111'],
    filter: 'grayscale(1) contrast(1.3) brightness(1.03)',
    overlay: null,
    vignette: 0.5,
    grain: 0.08,
  },
];

export function getGrade(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Title colour treatments for the big caption lettering.
export const TITLE_COLORS = [
  {
    id: 'sunset',
    name: 'Sunset fade',
    stops: [
      [0, '#ffffff'],
      [0.45, '#ffd166'],
      [1, '#ff5e78'],
    ],
  },
  {
    id: 'white',
    name: 'Clean white',
    stops: [
      [0, '#ffffff'],
      [1, '#f2f2f2'],
    ],
  },
  {
    id: 'neon',
    name: 'Neon ice',
    stops: [
      [0, '#a5f3fc'],
      [0.5, '#00e5ff'],
      [1, '#ff2d78'],
    ],
  },
];

export function getTitleColor(id) {
  return TITLE_COLORS.find((t) => t.id === id) ?? TITLE_COLORS[0];
}
