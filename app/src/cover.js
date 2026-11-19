// The cover renderer: draws the whole poster onto a 2D canvas — photo
// panels with the colour grade, the bold title lettering, the heat-meter
// stars, the badge ribbon, grain and vignette. One code path renders both
// the editor's live preview and the exported PNG, so what you see is what
// you share.

import { getLayout } from './layouts.js';
import { getGrade, getTitleColor } from './grades.js';

// Small deterministic PRNG so the film grain looks the same every render.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  const rand = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

function drawStarPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Cover-fit draw of one photo into a panel rect, with the panel's zoom and
// pan applied. Pan is -1..1 across the spare room the zoom creates.
function drawPhotoInto(ctx, img, rect, crop) {
  const zoom = crop?.zoom ?? 1;
  const panX = crop?.panX ?? 0;
  const panY = crop?.panY ?? 0;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = rect.x + (rect.w - dw) / 2 + (panX * Math.max(0, dw - rect.w)) / 2;
  const dy = rect.y + (rect.h - dh) / 2 + (panY * Math.max(0, dh - rect.h)) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPanelVignette(ctx, rect, strength) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.hypot(rect.w, rect.h) / 2;
  const g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawGradeOverlay(ctx, rect, grade) {
  if (!grade.overlay) return;
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  for (const [at, color] of grade.overlay.stops) g.addColorStop(at, color);
  ctx.save();
  ctx.globalCompositeOperation = grade.overlay.blend;
  ctx.globalAlpha = grade.overlay.alpha;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawOnePanel(ctx, img, rect, crop, grade, scale, opts) {
  ctx.save();
  if (opts.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(opts.rot);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  if (opts.frame) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18 * scale;
    ctx.shadowOffsetY = 8 * scale;
    ctx.fillStyle = '#fdfbf7';
    const f = 10 * scale;
    ctx.fillRect(rect.x - f, rect.y - f, rect.w + f * 2, rect.h + f * 2);
    ctx.shadowColor = 'transparent';
  }
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    ctx.filter = grade.filter;
    drawPhotoInto(ctx, img, rect, crop);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    g.addColorStop(0, '#2b1a3d');
    g.addColorStop(1, '#120e1c');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  drawGradeOverlay(ctx, rect, grade);
  drawPanelVignette(ctx, rect, grade.vignette * 0.6);
  ctx.restore();
}

// Shrink the display font until the title fits the zone width.
function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  }
  return size;
}

function drawTitleBlock(ctx, zone, state, scale) {
  const grade = getGrade(state.gradeId);
  const color = getTitleColor(state.titleColorId);
  const pad = 0.045 * state.size.w;

  if (zone.band) {
    const bg = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
    bg.addColorStop(0, '#171020');
    bg.addColorStop(1, '#0a0812');
    ctx.fillStyle = bg;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    // Sunset accent rule along the top of the band.
    const rule = ctx.createLinearGradient(zone.x, 0, zone.x + zone.w, 0);
    rule.addColorStop(0, grade.swatch[0]);
    rule.addColorStop(1, grade.swatch[1]);
    ctx.fillStyle = rule;
    ctx.fillRect(zone.x, zone.y, zone.w, Math.max(2, 3 * scale));
  } else if (zone.scrim) {
    const scrim = ctx.createLinearGradient(0, zone.y - zone.h * 0.5, 0, zone.y + zone.h);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(zone.x, zone.y - zone.h * 0.5, zone.w, zone.h * 1.5);
  }

  const title = (state.title || 'SUNSET RUN').toUpperCase();
  const titleSize = fitTitleFont(ctx, title, zone.w - pad * 2, zone.h * 0.52);
  const titleY = zone.y + zone.h * 0.52 + titleSize * 0.32;

  // Big condensed title with a sunset gradient fill and a hard outline.
  const tg = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY + titleSize * 0.15);
  for (const [at, c] of color.stops) tg.addColorStop(at, c);
  ctx.save();
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(2 * scale)}px`;
  } catch (_) {
    /* older browsers ignore letterSpacing */
  }
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10 * scale;
  ctx.shadowOffsetY = 4 * scale;
  ctx.lineWidth = Math.max(2, titleSize / 16);
  ctx.strokeStyle = '#12060f';
  ctx.strokeText(title, zone.x + pad, titleY);
  ctx.fillStyle = tg;
  ctx.fillText(title, zone.x + pad, titleY);
  ctx.restore();

  // Neon script subtitle under the title.
  const sub = state.subtitle || '';
  if (sub) {
    const subSize = Math.max(14, zone.h * 0.2);
    ctx.save();
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff7ab8';
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 16 * scale;
    ctx.fillText(sub, zone.x + pad + 4 * scale, titleY + subSize * 1.15);
    ctx.restore();
  }

  // Heat-meter stars, tucked into the top-right corner above the title line
  // so a long title never runs underneath them.
  if (state.showStars) {
    const starR = Math.max(7, zone.h * 0.1);
    const gap = starR * 2.4;
    const total = gap * 4 + starR * 2;
    let sx = zone.x + zone.w - pad - total + starR;
    const sy = zone.y + zone.h * 0.15;
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(255,180,0,0.8)';
    ctx.shadowBlur = 8 * scale;
    for (let i = 0; i < (state.starCount ?? 5); i++) {
      drawStarPath(ctx, sx, sy, starR);
      ctx.fill();
      sx += gap;
    }
    ctx.restore();
  }

  // Badge ribbon sticker, rotated, overlapping the band's top-left corner —
  // the stars own the top-right, so the badge lives on the other side. The
  // box sizes itself to the text, so a long badge never overflows it, and
  // the top is clamped so the rotation never clips it off the canvas.
  if (state.showBadge) {
    const bh = Math.max(20, zone.h * 0.24);
    const text = state.badgeText || 'NEW RELEASE';
    let fontSize = Math.round(bh * 0.42);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    const maxText = zone.w * 0.3;
    while (fontSize > 10 && ctx.measureText(text).width > maxText) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }
    const bw = ctx.measureText(text).width + bh * 0.9;
    const bx = zone.x + pad * 0.5;
    const by = Math.max(zone.y - bh * 0.45, 8 * scale);
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#ff2d78';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 3 * scale;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);
    ctx.restore();
  }

  // Tiny footer line: the app's signature, bottom-right of the band.
  if (zone.band) {
    ctx.save();
    ctx.font = `${Math.max(9, Math.round(11 * scale))}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SUNSET PRESS · MADE OFFLINE', zone.x + zone.w - pad, zone.y + zone.h - 6 * scale);
    ctx.restore();
  }
}

function applyGrain(ctx, w, h, amount) {
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = amount;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function applyFullVignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.hypot(w, h) / 2);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Draw the whole cover onto a canvas sized to state.size. The same function
// renders the editor preview and the exported PNG.
export function renderCover(canvas, state) {
  const { w, h } = state.size;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  const scale = w / 1080;
  const layout = getLayout(state.layoutId);
  const grade = getGrade(state.gradeId);
  const gutter = 6 * scale;

  // Backdrop: near-black, or a sunset wash for the tilted layout.
  if (state.layoutId === 'tilted') {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#2b1055');
    bg.addColorStop(0.5, '#a4133c');
    bg.addColorStop(1, '#ff7b00');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = '#0a0812';
    ctx.fillRect(0, 0, w, h);
  }

  const panels = layout.panels(w, h);
  panels.forEach((rect, i) => {
    const crop = state.panels[i] ?? { photo: i % Math.max(1, state.photos.length), zoom: 1, panX: 0, panY: 0 };
    const img = state.photos[crop.photo];
    const inset = {
      x: rect.x + gutter / 2,
      y: rect.y + gutter / 2,
      w: rect.w - gutter,
      h: rect.h - gutter,
    };
    drawOnePanel(ctx, img, inset, crop, grade, scale, {
      rot: rect.rot ?? 0,
      frame: state.layoutId === 'tilted',
    });
  });

  drawTitleBlock(ctx, layout.title(w, h), state, scale);

  if (state.layoutId === 'fullbleed' || state.layoutId === 'tilted') {
    applyFullVignette(ctx, w, h, grade.vignette * 0.7);
  }
  if (state.grain) applyGrain(ctx, w, h, grade.grain);
}

// Render the cover offscreen at export size and return a PNG blob.
export function exportCoverPNG(state) {
  const canvas = document.createElement('canvas');
  renderCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Which panel, if any, holds the point (px, py) in canvas pixels.
export function panelAt(state, px, py) {
  const { w, h } = state.size;
  const layout = getLayout(state.layoutId);
  const panels = layout.panels(w, h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
