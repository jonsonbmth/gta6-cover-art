// Vice Coast Press — the cover render engine.
// Draws the whole poster (photo panels, striped title, script subtitle,
// quote bar, role tabs, tagline ribbon, seal, barcode, credits, grain)
// onto any canvas at any size. Preview and export share this code path.
import { layoutById, panelRects } from './layouts.js';
import { gradeById, panelFilterById } from './grades.js';

export const SIZES = {
  square: { id: 'square', name: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', name: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', name: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

export function sizeById(id) {
  return SIZES[id] || SIZES.wide;
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitFontSize(ctx, text, family, weight, start, maxWidth) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawStar(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.22, y - s * 0.8);
  ctx.stroke();
  const tx = x + s * 0.22, ty = y - s * 0.8;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.08 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.34, ty - Math.sin(a) * s * 0.34,
      tx + Math.cos(a + 0.35) * s * 0.52, ty - Math.sin(a + 0.35) * s * 0.52 + s * 0.16,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhotoPanel(ctx, rect, img, panel, grade, gap) {
  const { x, y, w, h, tilt } = rect;
  ctx.save();
  if (tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img && img.naturalWidth > 0) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const cx = panel.cx ?? 0.5, cy = panel.cy ?? 0.35;
    let dx = x + w / 2 - cx * dw;
    let dy = y + h / 2 - cy * dh;
    dx = Math.min(x, Math.max(x + w - dw, dx));
    dy = Math.min(y, Math.max(y + h - dh, dy));
    const pf = panelFilterById(panel.filter);
    ctx.filter = pf.id === 'none' ? grade.photoFilter : `${grade.photoFilter} ${pf.filter}`;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3b0f4f'); g.addColorStop(0.55, '#c81d5e'); g.addColorStop(1, '#ff9e00');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,240,200,0.85)';
    ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.36, Math.min(w, h) * 0.16, 0, Math.PI * 2); ctx.fill();
    drawPalm(ctx, x + w * 0.2, y + h * 0.92, Math.min(w, h) * 0.34, 'rgba(20,4,30,0.9)');
    drawPalm(ctx, x + w * 0.62, y + h * 0.95, Math.min(w, h) * 0.42, 'rgba(20,4,30,0.9)');
  }
  ctx.restore();
  // Frame.
  ctx.save();
  if (tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.strokeStyle = grade.frame;
  ctx.lineWidth = Math.max(1.5, gap * 0.45);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawRoleTab(ctx, rect, panel, grade, unit) {
  if (!panel.role) return;
  const padX = unit * 0.55, slant = unit * 0.45;
  ctx.save();
  ctx.font = `700 ${Math.round(unit * 0.62)}px Anton, 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(panel.role).width;
  const tabW = Math.min(rect.w - unit * 0.4, tw + padX * 2 + slant);
  const tabH = unit * 1.05;
  const tx = rect.x + unit * 0.28, ty = rect.y + rect.h - tabH - unit * 0.28;
  if (rect.tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.tilt * Math.PI) / 180);
    ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  }
  ctx.beginPath();
  ctx.moveTo(tx + slant, ty);
  ctx.lineTo(tx + tabW, ty);
  ctx.lineTo(tx + tabW - slant, ty + tabH);
  ctx.lineTo(tx, ty + tabH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,4,18,0.92)';
  ctx.fill();
  ctx.fillStyle = grade.tabAccent;
  ctx.beginPath();
  ctx.moveTo(tx + slant, ty);
  ctx.lineTo(tx + slant + unit * 0.16, ty);
  ctx.lineTo(tx + unit * 0.16, ty + tabH);
  ctx.lineTo(tx, ty + tabH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(panel.role, tx + padX + slant * 0.5, ty + tabH / 2 + unit * 0.03);
  if (panel.subline && rect.w > unit * 7) {
    ctx.font = `600 ${Math.round(unit * 0.42)}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(panel.subline, tx + unit * 0.15, ty - unit * 0.42);
  }
  ctx.restore();
}

// The striped sunset title: an offscreen mask filled with horizontal bands.
function drawStripedTitle(ctx, text, cx, cy, size, bands, outline, tiltDeg) {
  const pad = size * 0.5;
  ctx.save();
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(text).width;
  const off = document.createElement('canvas');
  off.width = Math.ceil(tw + pad * 2);
  off.height = Math.ceil(size * 1.5 + pad * 2);
  const o = off.getContext('2d');
  o.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  o.textBaseline = 'middle';
  o.fillStyle = '#ffffff';
  o.fillText(text, pad, off.height / 2 + size * 0.04);
  o.globalCompositeOperation = 'source-in';
  const n = bands.length;
  for (let i = 0; i < n; i++) {
    o.fillStyle = bands[i];
    o.fillRect(0, (off.height / n) * i, off.width, off.height / n + 1);
  }
  ctx.translate(cx, cy);
  ctx.rotate((tiltDeg * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  // Drop shadow.
  ctx.fillStyle = 'rgba(10,2,20,0.55)';
  ctx.fillText(text, size * 0.045, size * 0.075);
  // Thick outline.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = size * 0.045;
  ctx.strokeText(text, 0, 0);
  // Striped fill.
  ctx.drawImage(off, -off.width / 2, -off.height / 2);
  // Sparkle.
  ctx.fillStyle = '#ffffff';
  drawStar(ctx, -tw / 2 + size * 0.08, -size * 0.42, size * 0.09, '#ffffff');
  ctx.restore();
}

function drawSeal(ctx, x, y, r, label, grade) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffe97a'); g.addColorStop(0.6, '#ffb703'); g.addColorStop(1, '#c77d02');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#7a4d00';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(122,77,0,0.8)';
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#3d2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = label.split(' ');
  const fs = r * (words.length > 2 ? 0.26 : 0.3);
  ctx.font = `700 ${fs}px Anton, 'Arial Narrow', sans-serif`;
  if (words.length <= 2) {
    ctx.fillText(label, 0, -r * 0.08);
  } else {
    ctx.fillText(words.slice(0, -1).join(' '), 0, -r * 0.2);
    ctx.fillText(words[words.length - 1], 0, r * 0.14);
  }
  drawStar(ctx, -r * 0.3, r * 0.42, r * 0.12, '#3d2400');
  drawStar(ctx, 0, r * 0.42, r * 0.12, '#3d2400');
  drawStar(ctx, r * 0.3, r * 0.42, r * 0.12, '#3d2400');
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seedText) {
  const rnd = mulberry32(hashString(seedText || 'vice'));
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + w * 0.06;
  while (bx < x + w * 0.94) {
    const bw = (1 + Math.floor(rnd() * 3)) * Math.max(1, w * 0.012);
    if (rnd() > 0.35) ctx.fillRect(bx, y + h * 0.12, bw, h * 0.62);
    bx += bw + Math.max(1, w * 0.012);
  }
  ctx.font = `700 ${Math.round(h * 0.16)}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const digits = String(hashString(seedText || 'vice')).padStart(10, '0').slice(0, 10);
  ctx.fillText(digits.replace(/(\d{5})(\d{5})/, '$1 $2'), x + w / 2, y + h * 0.88);
  ctx.restore();
}

function drawGrain(ctx, W, H, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  const n = Math.floor((W * H) / 900);
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

export function renderCover(canvas, state, images) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const unit = Math.min(W, H) / 34;
  const gap = Math.max(3, Math.min(W, H) * 0.008);

  // Backdrop.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#160a1e'); bg.addColorStop(0.5, '#241031'); bg.addColorStop(1, '#12081a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const topH = H * 0.062;
  const botH = H * 0.075;
  const stage = { x: W * 0.014, y: topH + H * 0.006, w: W * 0.972, h: H - topH - botH - H * 0.012 };
  const rects = panelRects(layout, stage, gap);

  // Photo panels.
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    drawPhotoPanel(ctx, rect, images.get(panel.photo || ''), panel, grade, gap);
  });

  // Grade tint over the stage.
  ctx.save();
  ctx.globalCompositeOperation = grade.overlayBlend;
  const og = ctx.createLinearGradient(stage.x, stage.y, stage.x, stage.y + stage.h);
  og.addColorStop(0, grade.overlay[0]);
  og.addColorStop(1, grade.overlay[1]);
  ctx.fillStyle = og;
  ctx.fillRect(stage.x, stage.y, stage.w, stage.h);
  ctx.restore();

  // Role tabs.
  rects.forEach((rect, i) => {
    drawRoleTab(ctx, rect, state.panels[i] || {}, grade, unit);
  });

  // Top quote bar.
  ctx.save();
  ctx.fillStyle = 'rgba(12,4,20,0.92)';
  ctx.fillRect(0, 0, W, topH);
  if (state.showQuote !== false && state.quote) {
    const starR = topH * 0.22;
    let sx = W * 0.02;
    for (let i = 0; i < 5; i++) {
      drawStar(ctx, sx + starR, topH / 2, starR, '#ffd319');
      sx += starR * 2.4;
    }
    const quote = `\u201C${state.quote}\u201D`;
    const qSize = fitFontSize(ctx, quote, 'Anton, \'Arial Narrow\', sans-serif', 400, topH * 0.44, W * 0.58);
    ctx.font = `${qSize}px Anton, 'Arial Narrow', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(quote, W * 0.5, topH / 2 + topH * 0.03);
    if (state.quoteSource) {
      ctx.font = `700 ${Math.round(topH * 0.26)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillStyle = grade.accent;
      const qw = ctx.measureText(quote).width;
      ctx.textAlign = 'left';
      ctx.fillText(`\u2014 ${state.quoteSource}`, W * 0.5 + qw / 2 + W * 0.012, topH / 2 + topH * 0.03);
    }
  }
  if (state.volume) {
    ctx.font = `700 ${Math.round(topH * 0.34)}px Anton, 'Arial Narrow', sans-serif`;
    const vw = ctx.measureText(state.volume).width + topH * 0.8;
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    const vx = W - vw - W * 0.014, vy = topH * 0.16;
    ctx.moveTo(vx + topH * 0.2, vy);
    ctx.lineTo(vx + vw, vy);
    ctx.lineTo(vx + vw - topH * 0.2, vy + topH * 0.68);
    ctx.lineTo(vx, vy + topH * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#160a1e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.volume, vx + vw / 2, vy + topH * 0.36);
  }
  ctx.restore();

  // Title block.
  const title = (state.title || 'VICE CITY').toUpperCase();
  const titleY = H * layout.titleY;
  const titleSize = fitFontSize(
    ctx, title, 'Anton, \'Arial Narrow\', sans-serif', 400,
    H * 0.155 * layout.titleScale, W * 0.94,
  );
  drawStripedTitle(ctx, title, W / 2, titleY, titleSize, grade.titleBands, grade.titleOutline, -1.5);

  // Script subtitle.
  if (state.subtitle) {
    ctx.save();
    ctx.translate(W / 2 + W * 0.06, titleY + titleSize * 0.72);
    ctx.rotate((-3 * Math.PI) / 180);
    const subSize = fitFontSize(ctx, state.subtitle, 'Pacifico, cursive', 400, titleSize * 0.42, W * 0.6);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = grade.subtitle;
    ctx.shadowBlur = subSize * 0.35;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, subSize * 0.07);
    ctx.strokeText(state.subtitle, 0, 0);
    ctx.fillStyle = grade.subtitle;
    ctx.fillText(state.subtitle, 0, 0);
    ctx.restore();
  }

  // Tagline ribbon.
  if (state.showTagline !== false && state.tagline) {
    ctx.save();
    const tagY = stage.y + stage.h - H * 0.012;
    const fs = fitFontSize(ctx, state.tagline, 'Anton, \'Arial Narrow\', sans-serif', 400, H * 0.026, W * 0.72);
    ctx.font = `${fs}px Anton, 'Arial Narrow', sans-serif`;
    const tw = ctx.measureText(state.tagline).width;
    const bw = tw + unit * 3.2, bh = fs * 1.9;
    const bx = (W - bw) / 2, by = tagY - bh / 2;
    ctx.beginPath();
    ctx.moveTo(bx + bh * 0.5, by);
    ctx.lineTo(bx + bw - bh * 0.5, by);
    ctx.lineTo(bx + bw, by + bh / 2);
    ctx.lineTo(bx + bw - bh * 0.5, by + bh);
    ctx.lineTo(bx + bh * 0.5, by + bh);
    ctx.lineTo(bx, by + bh / 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(8,2,14,0.94)';
    ctx.fill();
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(1, unit * 0.06);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline, W / 2, by + bh / 2 + fs * 0.04);
    drawPalm(ctx, bx - unit * 1.6, by + bh * 0.9, unit * 1.5, 'rgba(255,220,150,0.9)');
    drawPalm(ctx, bx + bw + unit * 0.4, by + bh * 0.9, unit * 1.5, 'rgba(255,220,150,0.9)');
    ctx.restore();
  }

  // Gold seal.
  if (state.showSeal !== false && state.seal) {
    drawSeal(ctx, W * 0.935, stage.y + stage.h * 0.82, Math.min(W, H) * 0.052, state.seal, grade);
  }

  // Bottom credits strip.
  ctx.save();
  const cy0 = H - botH;
  ctx.fillStyle = 'rgba(10,3,16,0.96)';
  ctx.fillRect(0, cy0, W, botH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, cy0, W, Math.max(1.5, H * 0.002));
  ctx.fillStyle = '#ffb3c8';
  ctx.font = `700 ${Math.round(botH * 0.3)}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', W * 0.016, cy0 + botH * 0.5);
  if (state.showCredits !== false && state.credits) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const cSize = fitFontSize(ctx, state.credits, '\'Helvetica Neue\', Arial, sans-serif', 600, botH * 0.24, W * 0.62);
    ctx.font = `600 ${cSize}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(state.credits, W * 0.5, cy0 + botH * 0.5);
  }
  if (state.showBarcode !== false) {
    drawBarcode(ctx, W * 0.93, cy0 + botH * 0.14, W * 0.055, botH * 0.72, title);
  }
  ctx.restore();

  // Vignette + grain.
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(8,0,14,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawGrain(ctx, W, H, hashString(title + state.grade + state.layout));
}

export function renderCoverToCanvas(w, h, state, images) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state, images);
  return canvas;
}
