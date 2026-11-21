// Vice Coast Press — colour grades.
// Each grade is a photo treatment (a canvas filter plus a tinted overlay),
// a striped title palette, and the accent colours of the poster furniture.
export const GRADES = [
  {
    id: 'sunset', name: 'Sunset',
    swatch: 'linear-gradient(135deg,#ffd319 0%,#ff2975 55%,#8c1eff 100%)',
    photoFilter: 'saturate(1.30) contrast(1.08) brightness(1.03)',
    overlay: ['rgba(255,110,40,0.20)', 'rgba(140,30,255,0.16)'],
    overlayBlend: 'soft-light',
    titleBands: ['#fff3b0', '#ffd319', '#ff9e00', '#ff2975', '#b537f2'],
    titleOutline: '#2b0a3d', subtitle: '#ff5da2', accent: '#ffd319',
    frame: '#ffe9a8', tabAccent: '#ffd319',
  },
  {
    id: 'neon', name: 'Vice Neon',
    swatch: 'linear-gradient(135deg,#00f5d4 0%,#ff2975 55%,#7b2ff7 100%)',
    photoFilter: 'saturate(1.55) contrast(1.12) brightness(1.00)',
    overlay: ['rgba(255,41,117,0.22)', 'rgba(0,245,212,0.18)'],
    overlayBlend: 'overlay',
    titleBands: ['#a7fff3', '#00f5d4', '#ff70a6', '#ff2975', '#7b2ff7'],
    titleOutline: '#12002b', subtitle: '#00f5d4', accent: '#00f5d4',
    frame: '#ff9ecf', tabAccent: '#00f5d4',
  },
  {
    id: 'gold', name: 'Gold Hour',
    swatch: 'linear-gradient(135deg,#fff1a8 0%,#ffb703 55%,#fb8500 100%)',
    photoFilter: 'saturate(1.22) contrast(1.06) brightness(1.05) sepia(0.18)',
    overlay: ['rgba(255,183,3,0.22)', 'rgba(251,133,0,0.14)'],
    overlayBlend: 'soft-light',
    titleBands: ['#fffbe6', '#ffe066', '#ffb703', '#fb8500', '#e85d04'],
    titleOutline: '#3d1c00', subtitle: '#ffb703', accent: '#ffb703',
    frame: '#ffdf8e', tabAccent: '#ffb703',
  },
  {
    id: 'teal', name: 'Teal Dusk',
    swatch: 'linear-gradient(135deg,#90e0ef 0%,#0077b6 55%,#03045e 100%)',
    photoFilter: 'saturate(1.15) contrast(1.08) brightness(0.98) hue-rotate(-12deg)',
    overlay: ['rgba(0,180,216,0.20)', 'rgba(3,4,94,0.22)'],
    overlayBlend: 'soft-light',
    titleBands: ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#5e60ce'],
    titleOutline: '#02023b', subtitle: '#90e0ef', accent: '#90e0ef',
    frame: '#a8e6f0', tabAccent: '#00b4d8',
  },
  {
    id: 'mono', name: 'Monochrome',
    swatch: 'linear-gradient(135deg,#ffffff 0%,#9a9a9a 55%,#111111 100%)',
    photoFilter: 'grayscale(1) contrast(1.16) brightness(1.04)',
    overlay: ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.18)'],
    overlayBlend: 'soft-light',
    titleBands: ['#ffffff', '#e8e8e8', '#bdbdbd', '#7a7a7a', '#3d3d3d'],
    titleOutline: '#000000', subtitle: '#e8e8e8', accent: '#ffffff',
    frame: '#e8e8e8', tabAccent: '#ffffff',
  },
  {
    id: 'candy', name: 'Candy',
    swatch: 'linear-gradient(135deg,#ffafcc 0%,#ffc8dd 40%,#bde0fe 100%)',
    photoFilter: 'saturate(1.80) contrast(1.04) brightness(1.06)',
    overlay: ['rgba(255,175,204,0.20)', 'rgba(189,224,254,0.18)'],
    overlayBlend: 'soft-light',
    titleBands: ['#fff0f3', '#ffafcc', '#ff8fab', '#c8b6ff', '#7bdff2'],
    titleOutline: '#4a1042', subtitle: '#ff8fab', accent: '#ffafcc',
    frame: '#ffd6e8', tabAccent: '#ff8fab',
  },
  {
    id: 'noir', name: 'Noir',
    swatch: 'linear-gradient(135deg,#e5383b 0%,#3a0a0a 60%,#000000 100%)',
    photoFilter: 'grayscale(0.65) contrast(1.32) brightness(0.88)',
    overlay: ['rgba(229,56,59,0.16)', 'rgba(0,0,0,0.28)'],
    overlayBlend: 'multiply',
    titleBands: ['#ffe5e5', '#ff8fa3', '#e5383b', '#8d0801', '#2b0505'],
    titleOutline: '#000000', subtitle: '#ff8fa3', accent: '#e5383b',
    frame: '#ffb3ab', tabAccent: '#e5383b',
  },
  {
    id: 'pastel', name: 'Pastel',
    swatch: 'linear-gradient(135deg,#fdfd96 0%,#ffb6c1 50%,#c3aed6 100%)',
    photoFilter: 'saturate(0.85) contrast(0.98) brightness(1.10)',
    overlay: ['rgba(255,182,193,0.18)', 'rgba(195,174,214,0.16)'],
    overlayBlend: 'soft-light',
    titleBands: ['#fffdf5', '#fdfd96', '#ffb6c1', '#f9a8d4', '#c3aed6'],
    titleOutline: '#4a2b4d', subtitle: '#f9a8d4', accent: '#fdfd96',
    frame: '#fff3c4', tabAccent: '#ffb6c1',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Per-panel photo filters, applied on top of the grade.
export const PANEL_FILTERS = [
  { id: 'none', name: 'None', filter: 'none' },
  { id: 'punch', name: 'Punch', filter: 'saturate(1.4) contrast(1.15)' },
  { id: 'bw', name: 'B & W', filter: 'grayscale(1) contrast(1.1)' },
  { id: 'sepia', name: 'Sepia', filter: 'sepia(0.55) saturate(1.1)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(1.1) hue-rotate(-18deg) brightness(1.02)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(1.2) sepia(0.25) brightness(1.03)' },
];

export function panelFilterById(id) {
  return PANEL_FILTERS.find((f) => f.id === id) || PANEL_FILTERS[0];
}
