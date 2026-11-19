// Sunset Press editor: wires the controls to the cover renderer, loads the
// sample photos and the person's own uploads, and handles per-panel crop and
// position. Everything runs in the browser; no photo ever leaves the machine.
//
// Screenshot scenes: ?shot=cover draws the cover alone, edge to edge, for a
// clean capture of the exported art (layout/grade/size/title/subtitle can be
// overridden as query params, e.g. ?shot=cover&layout=classic&size=wide).

import { renderCover, exportCoverPNG, panelAt } from './cover.js';
import { LAYOUTS, SIZES, getLayout, getSize } from './layouts.js';
import { GRADES, TITLE_COLORS } from './grades.js';

const SAMPLES = [
  // focusY marks where the face sits (0 = top of the photo), so a wide
  // panel crops around the person instead of cutting their head off.
  { src: 'samples/boulevard.jpg', name: 'Boulevard', focusY: 0.18 },
  { src: 'samples/neon.jpg', name: 'Neon street', focusY: 0.4 },
  { src: 'samples/rooftop.jpg', name: 'Rooftop', focusY: 0.42 },
  { src: 'samples/pier.jpg', name: 'Pier', focusY: 0.32 },
];

const state = {
  size: { w: 1080, h: 1350 },
  sizeId: 'portrait',
  layoutId: 'classic',
  gradeId: 'sunset',
  titleColorId: 'sunset',
  title: 'SUNSET RUN',
  subtitle: 'a night in neon',
  photos: [],
  photoNames: [],
  photoFocus: [],
  panels: [],
  selectedPanel: 0,
  showStars: true,
  starCount: 5,
  showBadge: true,
  badgeText: 'NEW RELEASE',
  grain: true,
  vignette: true,
};

for (let i = 0; i < 6; i++) {
  state.panels.push({ photo: 0, zoom: 1, panX: 0, panY: 0, custom: false, cropManual: false });
}

// Each layout ships a default photo arrangement that keeps repeats far
// apart. It only touches panels the person has not assigned themselves,
// so switching layouts never clobbers their choices. It also sets a smart
// default crop: when a panel shows only part of a photo's height, the crop
// centres on the photo's focus point (the face), instead of the middle of
// the photo. A panel the person has cropped by hand (cropManual) keeps
// their crop; every other panel re-adapts whenever the layout or size
// changes, so the face stays framed.
function applyLayoutDefaults() {
  if (!state.photos.length) return;
  const layout = getLayout(state.layoutId);
  const defaults = layout.defaultPhotos ?? [];
  const rects = layout.panels(state.size.w, state.size.h);
  defaults.forEach((photo, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    if (!panel.custom) panel.photo = photo % state.photos.length;
    const img = state.photos[panel.photo];
    const rect = rects[i];
    if (!img || !rect || panel.cropManual) return;
    // Fraction of the photo's height the panel shows; near 1 means the
    // whole photo fits and no crop is needed.
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const slice = rect.h / (img.naturalHeight * scale);
    if (slice >= 0.95) {
      panel.panY = 0;
      return;
    }
    // Pan runs -1 (bottom of the photo) to +1 (top); pick the pan that
    // puts the focus point in the middle of the visible slice.
    const focusY = state.photoFocus[panel.photo] ?? 0.35;
    const top = Math.max(0, Math.min(1 - slice, focusY - slice / 2));
    panel.panY = 1 - (2 * top) / (1 - slice);
  });
}

let preview = null;
let renderQueued = false;

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (preview) renderCover(preview, state);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.src);
      state.photos.push(img);
      state.photoNames.push(s.name);
      state.photoFocus.push(s.focusY ?? 0.35);
    } catch (_) {
      // A missing sample never breaks the editor; uploads still work.
    }
  }
  refreshPhotoStrip();
  queueRender();
}

function addUploads(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  let loaded = 0;
  for (const file of files) {
    const url = URL.createObjectURL(file);
    loadImage(url)
      .then((img) => {
        state.photos.push(img);
        state.photoNames.push(file.name.replace(/\.[^.]+$/, ''));
        state.photoFocus.push(0.35);
        loaded++;
        if (loaded === files.length) {
          // New photos go straight into the selected panel.
          const panel = state.panels[state.selectedPanel];
          panel.photo = state.photos.length - 1;
          panel.custom = true;
          panel.cropManual = false;
          applyLayoutDefaults();
          refreshPhotoStrip();
          queueRender();
        }
      })
      .catch(() => URL.revokeObjectURL(url));
  }
}

function refreshPhotoStrip() {
  const strip = document.getElementById('photo-strip');
  if (!strip) return;
  strip.innerHTML = '';
  state.photos.forEach((img, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = state.photoNames[i] || `Photo ${i + 1}`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = btn.title;
    btn.appendChild(thumb);
    const used = state.panels.some((p) => p.photo === i);
    if (used) btn.classList.add('in-use');
    btn.addEventListener('click', () => {
      const panel = state.panels[state.selectedPanel];
      panel.photo = i;
      panel.custom = true;
      panel.cropManual = false;
      applyLayoutDefaults();
      refreshPhotoStrip();
      queueRender();
    });
    strip.appendChild(btn);
  });
  const count = document.getElementById('photo-count');
  if (count) count.textContent = `${state.photos.length} photos`;
}

function buildLayoutButtons() {
  const wrap = document.getElementById('layout-pick');
  LAYOUTS.forEach((l) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.layout = l.id;
    btn.innerHTML = `<span class="pick-name">${l.name}</span><span class="pick-blurb">${l.blurb}</span>`;
    btn.addEventListener('click', () => {
      state.layoutId = l.id;
      state.selectedPanel = 0;
      applyLayoutDefaults();
      document.querySelectorAll('#layout-pick .pick').forEach((b) => b.classList.toggle('active', b === btn));
      syncPanelControls();
      queueRender();
    });
    wrap.appendChild(btn);
  });
  wrap.querySelector('[data-layout="classic"]').classList.add('active');
}

function buildGradeSwatches() {
  const wrap = document.getElementById('grade-pick');
  GRADES.forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.grade = g.id;
    btn.title = g.name;
    btn.style.background = `linear-gradient(135deg, ${g.swatch[0]}, ${g.swatch[1]})`;
    const label = document.createElement('span');
    label.textContent = g.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.gradeId = g.id;
      document.querySelectorAll('#grade-pick .swatch').forEach((b) => b.classList.toggle('active', b === btn));
      queueRender();
    });
    wrap.appendChild(btn);
  });
  wrap.querySelector('[data-grade="sunset"]').classList.add('active');
}

function buildTitleColors() {
  const sel = document.getElementById('title-color');
  TITLE_COLORS.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    state.titleColorId = sel.value;
    queueRender();
  });
}

function buildSizeSelect() {
  const sel = document.getElementById('size-select');
  SIZES.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    sel.appendChild(opt);
  });
  sel.value = 'portrait';
  sel.addEventListener('change', () => {
    const s = getSize(sel.value);
    state.sizeId = s.id;
    state.size = { w: s.w, h: s.h };
    applyLayoutDefaults();
    queueRender();
  });
}

function syncPanelControls() {
  const crop = state.panels[state.selectedPanel];
  const zoom = document.getElementById('zoom-range');
  const zoomVal = document.getElementById('zoom-value');
  const label = document.getElementById('panel-label');
  if (zoom) zoom.value = String(crop.zoom);
  if (zoomVal) zoomVal.textContent = `${Math.round(crop.zoom * 100)}%`;
  if (label) label.textContent = `Panel ${state.selectedPanel + 1}`;
}

function bindPanelControls() {
  const zoom = document.getElementById('zoom-range');
  zoom.addEventListener('input', () => {
    const panel = state.panels[state.selectedPanel];
    panel.zoom = parseFloat(zoom.value);
    panel.cropManual = true;
    syncPanelControls();
    queueRender();
  });
  document.getElementById('fill-all').addEventListener('click', () => {
    const photo = state.panels[state.selectedPanel].photo;
    state.panels.forEach((p) => {
      p.photo = photo;
      p.custom = true;
      p.cropManual = false;
    });
    applyLayoutDefaults();
    refreshPhotoStrip();
    queueRender();
  });
  document.getElementById('reset-crop').addEventListener('click', () => {
    const p = state.panels[state.selectedPanel];
    p.zoom = 1;
    p.panX = 0;
    p.panY = 0;
    p.cropManual = false;
    applyLayoutDefaults();
    syncPanelControls();
    queueRender();
  });
}

function bindCaptionControls() {
  const title = document.getElementById('title-input');
  const subtitle = document.getElementById('subtitle-input');
  const badge = document.getElementById('badge-input');
  title.addEventListener('input', () => {
    state.title = title.value;
    queueRender();
  });
  subtitle.addEventListener('input', () => {
    state.subtitle = subtitle.value;
    queueRender();
  });
  badge.addEventListener('input', () => {
    state.badgeText = badge.value;
    queueRender();
  });
}

function bindToggles() {
  const map = [
    ['toggle-stars', 'showStars'],
    ['toggle-badge', 'showBadge'],
    ['toggle-grain', 'grain'],
  ];
  for (const [id, key] of map) {
    const el = document.getElementById(id);
    el.addEventListener('change', () => {
      state[key] = el.checked;
      queueRender();
    });
  }
}

function bindCanvasInteraction() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function toCanvas(e) {
    const r = preview.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * state.size.w,
      y: ((e.clientY - r.top) / r.height) * state.size.h,
    };
  }

  preview.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = panelAt(state, p.x, p.y);
    if (hit < 0) return;
    state.selectedPanel = hit;
    syncPanelControls();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = preview.getBoundingClientRect();
    const crop = state.panels[state.selectedPanel];
    const dx = ((e.clientX - lastX) / r.width) * 2;
    const dy = ((e.clientY - lastY) / r.height) * 2;
    crop.panX = Math.max(-1, Math.min(1, crop.panX + dx));
    crop.panY = Math.max(-1, Math.min(1, crop.panY + dy));
    crop.cropManual = true;
    lastX = e.clientX;
    lastY = e.clientY;
    queueRender();
  });
  preview.addEventListener('pointerup', () => {
    dragging = false;
  });
  preview.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const crop = state.panels[state.selectedPanel];
      crop.zoom = Math.max(1, Math.min(3, crop.zoom + (e.deltaY < 0 ? 0.1 : -0.1)));
      crop.cropManual = true;
      syncPanelControls();
      queueRender();
    },
    { passive: false },
  );
}

function bindUploads() {
  const input = document.getElementById('file-input');
  const zone = document.getElementById('dropzone');
  input.addEventListener('change', () => {
    addUploads(input.files);
    input.value = '';
  });
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag');
    addUploads(e.dataTransfer.files);
  });
}

async function exportPNG() {
  const btn = document.getElementById('export-btn');
  btn.disabled = true;
  btn.textContent = 'Exporting…';
  try {
    const blob = await exportCoverPNG(state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
    a.href = url;
    a.download = `sunset-press-${slug}-${state.size.w}x${state.size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Export PNG';
  }
}

// Screenshot scenes: ?shot=cover renders the cover alone, edge to edge.
function applyShotParams() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (q.get('layout')) state.layoutId = q.get('layout');
  if (q.get('grade')) state.gradeId = q.get('grade');
  if (q.get('size')) {
    const s = getSize(q.get('size'));
    state.sizeId = s.id;
    state.size = { w: s.w, h: s.h };
  }
  if (q.get('title')) state.title = q.get('title');
  if (q.get('subtitle') !== null) state.subtitle = q.get('subtitle') || '';
  if (q.get('stars') === '0') state.showStars = false;
  if (q.get('badge') === '0') state.showBadge = false;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  }
  return shot;
}

async function init() {
  preview = document.getElementById('preview');
  const shot = applyShotParams();

  buildLayoutButtons();
  buildGradeSwatches();
  buildTitleColors();
  buildSizeSelect();
  bindPanelControls();
  bindCaptionControls();
  bindToggles();
  bindCanvasInteraction();
  bindUploads();
  document.getElementById('export-btn').addEventListener('click', exportPNG);

  // The display fonts are local files; wait for them so the first render
  // already shows the real lettering, then re-render when they arrive.
  try {
    await Promise.race([
      Promise.all([document.fonts.load('100px Anton'), document.fonts.load('40px Pacifico')]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (_) {
    /* fall back to system fonts */
  }
  document.fonts.ready.then(queueRender);

  await loadSamples();
  applyLayoutDefaults();
  syncPanelControls();
  queueRender();

  // Handle for headless tests and screenshots.
  window.__sunsetPress = {
    state,
    renderCover,
    exportCoverPNG,
    applyLayoutDefaults,
    ready: Promise.resolve(true),
  };
  document.body.dataset.ready = 'true';
}

init();
