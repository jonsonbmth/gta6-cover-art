// Vice Coast Press — cover layouts.
// Every layout is a set of photo panels placed inside the poster stage (the
// area between the top quote bar and the bottom credits strip). Panel rects
// are fractions of the stage, so one layout works at every export size.
// tilt is a small rotation in degrees for the collage feel.
export const LAYOUTS = [
  {
    id: 'grid', name: 'Grid 6', panels: 6, titleY: 0.54, titleScale: 1.0,
    rects: [
      [0.00, 0.00, 0.333, 0.50], [0.333, 0.00, 0.334, 0.50], [0.667, 0.00, 0.333, 0.50],
      [0.00, 0.50, 0.333, 0.50], [0.333, 0.50, 0.334, 0.50], [0.667, 0.50, 0.333, 0.50],
    ],
  },
  {
    id: 'hero', name: 'Hero + 4', panels: 5, titleY: 0.56, titleScale: 1.05,
    rects: [
      [0.00, 0.00, 0.54, 1.00],
      [0.54, 0.00, 0.23, 0.50], [0.77, 0.00, 0.23, 0.50],
      [0.54, 0.50, 0.23, 0.50], [0.77, 0.50, 0.23, 0.50],
    ],
  },
  {
    id: 'split', name: 'Split Duo', panels: 2, titleY: 0.52, titleScale: 1.1,
    rects: [
      [0.00, 0.00, 0.50, 1.00], [0.50, 0.00, 0.50, 1.00],
    ],
  },
  {
    id: 'strip', name: 'Strip', panels: 4, titleY: 0.60, titleScale: 1.0,
    rects: [
      [0.00, 0.00, 1.00, 0.55],
      [0.00, 0.55, 0.333, 0.45], [0.333, 0.55, 0.334, 0.45], [0.667, 0.55, 0.333, 0.45],
    ],
  },
  {
    id: 'collage', name: 'Collage 7', panels: 7, titleY: 0.58, titleScale: 0.98,
    rects: [
      [0.00, 0.00, 0.38, 1.00, -1.2],
      [0.38, 0.00, 0.207, 0.32, 0.8], [0.587, 0.00, 0.207, 0.32, -0.6], [0.794, 0.00, 0.206, 0.32, 1.0],
      [0.38, 0.32, 0.31, 0.34, -0.8], [0.69, 0.32, 0.31, 0.34, 0.7],
      [0.38, 0.66, 0.62, 0.34, -0.5],
    ],
  },
  {
    id: 'portrait', name: 'Portrait Trio', panels: 3, titleY: 0.55, titleScale: 1.05,
    rects: [
      [0.00, 0.00, 0.25, 1.00], [0.25, 0.00, 0.50, 1.00], [0.75, 0.00, 0.25, 1.00],
    ],
  },
  {
    id: 'square', name: 'Square 4', panels: 4, titleY: 0.54, titleScale: 1.0,
    rects: [
      [0.00, 0.00, 0.50, 0.50], [0.50, 0.00, 0.50, 0.50],
      [0.00, 0.50, 0.50, 0.50], [0.50, 0.50, 0.50, 0.50],
    ],
  },
  {
    id: 'story', name: 'Story Stack', panels: 3, titleY: 0.56, titleScale: 1.0,
    rects: [
      [0.00, 0.00, 1.00, 0.60],
      [0.00, 0.60, 0.50, 0.40], [0.50, 0.60, 0.50, 0.40],
    ],
  },
  {
    id: 'triptych', name: 'Triptych', panels: 3, titleY: 0.52, titleScale: 1.1,
    rects: [
      [0.00, 0.00, 0.333, 1.00], [0.333, 0.00, 0.334, 1.00], [0.667, 0.00, 0.333, 1.00],
    ],
  },
  {
    id: 'duo', name: 'Duo Inset', panels: 2, titleY: 0.50, titleScale: 1.05,
    rects: [
      [0.00, 0.00, 1.00, 1.00],
      [0.66, 0.62, 0.30, 0.34, 2.5],
    ],
  },
  {
    id: 'wide', name: 'Filmstrip 5', panels: 5, titleY: 0.54, titleScale: 1.0,
    rects: [
      [0.00, 0.00, 0.20, 1.00], [0.20, 0.00, 0.20, 1.00], [0.40, 0.00, 0.20, 1.00],
      [0.60, 0.00, 0.20, 1.00], [0.80, 0.00, 0.20, 1.00],
    ],
  },
  {
    id: 'minimal', name: 'Minimal', panels: 1, titleY: 0.68, titleScale: 1.15,
    rects: [
      [0.00, 0.00, 1.00, 1.00],
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rects in pixels for a stage box {x, y, w, h}. The gap is split
// between neighbours so panels never touch.
export function panelRects(layout, stage, gap) {
  return layout.rects.map(([fx, fy, fw, fh, tilt = 0]) => ({
    x: stage.x + fx * stage.w + (fx > 0 ? gap / 2 : 0),
    y: stage.y + fy * stage.h + (fy > 0 ? gap / 2 : 0),
    w: fw * stage.w - (fx > 0 ? gap / 2 : 0) - (fx + fw < 1 ? gap / 2 : 0),
    h: fh * stage.h - (fy > 0 ? gap / 2 : 0) - (fy + fh < 1 ? gap / 2 : 0),
    tilt,
  }));
}
