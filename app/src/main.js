// Vice Coast Press — editor UI: state, undo, save/load, export, shots.
// The canvas preview and the exported PNG share the cover engine in cover.js.
import { LAYOUTS, layoutById, panelRects } from './layouts.js';
import { GRADES, gradeById, PANEL_FILTERS } from './grades.js';
import { SIZES, sizeById, renderCover, renderCoverToCanvas } from './cover.js';

export const SAMPLES = [
  { key: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg', role: 'THE DRIVER', subline: 'OCEAN DRIVE · 6:42 PM' },
  { key: 'rooftop', label: 'Rooftop', file: 'samples/rooftop.jpg', role: 'THE BOSS', subline: 'ROOFTOP BAR · 8:05 PM' },
  { key: 'neon', label: 'Neon Street', file: 'samples/neon.jpg', role: 'THE FIXER', subline: 'NEON ROW · 11:20 PM' },
  { key: 'rider', label: 'Rider', file: 'samples/rider.jpg', role: 'THE RIDER', subline: 'COAST HIGHWAY · 7:15 PM' },
  { key: 'friends', label: 'Friends', file: 'samples/friends.jpg', role: 'THE CREW', subline: 'DINER ALLEY · 12:40 AM' },
  { key: 'pier', label: 'Pier', file: 'samples/pier.jpg', role: 'THE CAPTAIN', subline: 'MARINA DEL SOL · 7:48 PM' },
];

const MAX_PANELS = 7;
const STORE_KEY = 'vice-coast-press-v2';

function defaultPanels() {
  return SAMPLES.slice(0, MAX_PANELS).map((s, i) => ({
    photo: s.key, role: s.role, subline: s.subline,
    cx: 0.5, cy: 0.35, zoom: 1, filter: 'none',
  })).concat(Array.from({ length: MAX_PANELS - SAMPLES.length }, (_, i) => ({
    photo: SAMPLES[i % SAMPLES.length].key, role: 'THE LOOKOUT', subline: '',
    cx: 0.5, cy: 0.35, zoom: 1, filter: 'none',
  })));
}

export function defaultState() {
  return {
    layout: 'collage', grade: 'sunset', size: 'wide',
    title: 'NEON HARBOR', subtitle: 'Salt & Sirens',
    tagline: 'SEVEN LIVES · ONE HARBOR · NO WAY BACK',
    quote: 'PURE SALT-WATER MAYHEM', quoteSource: 'THE HARBOR POST',
    credits: 'A NEON HARBOR PICTURE · STARRING THE DRIVER · THE BOSS · THE RIDER · SHOT ON YOUR OWN CAMERA',
    volume: 'VOL. 01', seal: 'ORIGINAL COVER ART',
    showQuote: true, showTagline: true, showSeal: true, showBarcode: true, showCredits: true,
    panels: defaultPanels(),
  };
}

const state = defaultState();
const images = new Map();
let selectedPanel = 0;
let history = [];
let future = [];
let uploadCount = 0;

const $ = (id) => document.getElementById(id);
const preview = $('preview');

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function pushHistory() {
  history.push(clone(state));
  if (history.length > 50) history.shift();
  future = [];
  updateUndoButtons();
}

function undo() {
  if (!history.length) return;
  future.push(clone(state));
  Object.assign(state, history.pop());
  syncControls();
  render();
  updateUndoButtons();
}

function redo() {
  if (!future.length) return;
  history.push(clone(state));
  Object.assign(state, future.pop());
  syncControls();
  render();
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undoBtn').disabled = history.length === 0;
  $('redoBtn').disabled = future.length === 0;
}

function mutate(fn) {
  pushHistory();
  fn();
  render();
}

function loadImage(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images.set(key, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  await Promise.all(SAMPLES.map((s) => loadImage(s.key, s.file)));
}

function previewSize() {
  const size = sizeById(state.size);
  const maxW = 980, maxH = 720;
  const scale = Math.min(maxW / size.w, maxH / size.h, 1);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function render() {
  if (document.body.classList.contains('shot-cover')) {
    preview.width = window.innerWidth;
    preview.height = window.innerHeight;
  } else {
    const { w, h } = previewSize();
    if (preview.width !== w) preview.width = w;
    if (preview.height !== h) preview.height = h;
  }
  renderCover(preview, state, images);
}

function panelRectsOnPreview() {
  const W = preview.width, H = preview.height;
  const topH = H * 0.062, botH = H * 0.075;
  const stage = { x: W * 0.014, y: topH + H * 0.006, w: W * 0.972, h: H - topH - botH - H * 0.012 };
  const gap = Math.max(3, Math.min(W, H) * 0.008);
  return panelRects(layoutById(state.layout), stage, gap);
}

function panelAt(px, py) {
  const rects = panelRectsOnPreview();
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function selectPanel(i) {
  selectedPanel = Math.max(0, Math.min(i, layoutById(state.layout).panels - 1));
  syncPanelControls();
  document.querySelectorAll('#panelList button').forEach((b, j) => {
    b.classList.toggle('active', j === selectedPanel);
  });
}

// ---- Controls ----

function buildLayoutGrid() {
  const grid = $('layoutGrid');
  LAYOUTS.forEach((layout) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.dataset.layout = layout.id;
    b.title = layout.name;
    b.innerHTML = `<span class="mini">${layout.rects.map(([x, y, w, h]) =>
      `<i style="left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%"></i>`).join('')}</span><span class="lbl">${layout.name}</span>`;
    b.addEventListener('click', () => {
      mutate(() => { state.layout = layout.id; });
      selectPanel(Math.min(selectedPanel, layout.panels - 1));
      syncLayoutButtons();
    });
    grid.appendChild(b);
  });
}

function syncLayoutButtons() {
  document.querySelectorAll('.layout-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
}

function buildGradeRow() {
  const row = $('gradeRow');
  GRADES.forEach((grade) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.dataset.grade = grade.id;
    b.title = grade.name;
    b.innerHTML = `<span class="sw" style="background:${grade.swatch}"></span><span class="lbl">${grade.name}</span>`;
    b.addEventListener('click', () => {
      mutate(() => { state.grade = grade.id; });
      syncGradeButtons();
    });
    row.appendChild(b);
  });
}

function syncGradeButtons() {
  document.querySelectorAll('.grade-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
}

function buildSizeRow() {
  const row = $('sizeRow');
  Object.values(SIZES).forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size-btn';
    b.dataset.size = size.id;
    b.textContent = size.name;
    b.addEventListener('click', () => {
      mutate(() => { state.size = size.id; });
      syncSizeButtons();
    });
    row.appendChild(b);
  });
}

function syncSizeButtons() {
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
}

function buildSampleStrip() {
  const strip = $('sampleStrip');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample-btn';
    b.dataset.sample = s.key;
    b.title = `${s.label} — assign to panel ${selectedPanel + 1}`;
    b.innerHTML = `<img src="${s.file}" alt="${s.label}"><span>${s.label}</span>`;
    b.addEventListener('click', () => {
      mutate(() => {
        const p = state.panels[selectedPanel];
        p.photo = s.key;
        if (!p.role) { p.role = s.role; p.subline = s.subline; }
      });
    });
    strip.appendChild(b);
  });
}

function buildPanelList() {
  const list = $('panelList');
  list.innerHTML = '';
  const n = layoutById(state.layout).panels;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => selectPanel(i));
    list.appendChild(b);
  }
  selectPanel(selectedPanel);
}

function syncPanelControls() {
  buildPanelList();
  const p = state.panels[selectedPanel] || {};
  $('roleInput').value = p.role || '';
  $('sublineInput').value = p.subline || '';
  $('zoomInput').value = p.zoom || 1;
  $('zoomVal').textContent = `${Math.round((p.zoom || 1) * 100)}%`;
  $('filterSelect').value = p.filter || 'none';
  $('panelPhoto').value = p.photo || '';
}

function syncLettering() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  $('quoteInput').value = state.quote;
  $('quoteSourceInput').value = state.quoteSource;
  $('creditsInput').value = state.credits;
  $('volumeInput').value = state.volume;
  $('sealInput').value = state.seal;
  $('quoteToggle').checked = state.showQuote !== false;
  $('taglineToggle').checked = state.showTagline !== false;
  $('sealToggle').checked = state.showSeal !== false;
  $('barcodeToggle').checked = state.showBarcode !== false;
  $('creditsToggle').checked = state.showCredits !== false;
}

function syncControls() {
  syncLayoutButtons();
  syncGradeButtons();
  syncSizeButtons();
  syncLettering();
  syncPanelControls();
}

function bindLettering() {
  const bind = (id, key) => {
    $(id).addEventListener('input', () => {
      state[key] = $(id).value;
      render();
    });
    $(id).addEventListener('change', () => pushHistory());
  };
  bind('titleInput', 'title');
  bind('subtitleInput', 'subtitle');
  bind('taglineInput', 'tagline');
  bind('quoteInput', 'quote');
  bind('quoteSourceInput', 'quoteSource');
  bind('creditsInput', 'credits');
  bind('volumeInput', 'volume');
  bind('sealInput', 'seal');
  const toggle = (id, key) => {
    $(id).addEventListener('change', () => {
      mutate(() => { state[key] = $(id).checked; });
    });
  };
  toggle('quoteToggle', 'showQuote');
  toggle('taglineToggle', 'showTagline');
  toggle('sealToggle', 'showSeal');
  toggle('barcodeToggle', 'showBarcode');
  toggle('creditsToggle', 'showCredits');
}

function bindPanelControls() {
  $('roleInput').addEventListener('input', () => {
    state.panels[selectedPanel].role = $('roleInput').value.toUpperCase();
    render();
  });
  $('roleInput').addEventListener('change', () => pushHistory());
  $('sublineInput').addEventListener('input', () => {
    state.panels[selectedPanel].subline = $('sublineInput').value.toUpperCase();
    render();
  });
  $('sublineInput').addEventListener('change', () => pushHistory());
  $('zoomInput').addEventListener('input', () => {
    state.panels[selectedPanel].zoom = parseFloat($('zoomInput').value);
    $('zoomVal').textContent = `${Math.round(state.panels[selectedPanel].zoom * 100)}%`;
    render();
  });
  $('zoomInput').addEventListener('change', () => pushHistory());
  $('filterSelect').addEventListener('change', () => {
    mutate(() => { state.panels[selectedPanel].filter = $('filterSelect').value; });
  });
  $('panelPhoto').addEventListener('change', () => {
    mutate(() => { state.panels[selectedPanel].photo = $('panelPhoto').value; });
  });
  $('faceFocusBtn').addEventListener('click', () => {
    mutate(() => {
      const p = state.panels[selectedPanel];
      p.cx = 0.5; p.cy = 0.3; p.zoom = Math.max(p.zoom || 1, 1.15);
    });
  });
  $('centerFocusBtn').addEventListener('click', () => {
    mutate(() => {
      const p = state.panels[selectedPanel];
      p.cx = 0.5; p.cy = 0.5; p.zoom = 1;
    });
  });
}

function bindPhotoUpload() {
  const input = $('photoInput');
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const key = `upload-${++uploadCount}`;
    const url = URL.createObjectURL(file);
    loadImage(key, url).then(() => {
      mutate(() => { state.panels[selectedPanel].photo = key; });
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `Upload ${uploadCount}: ${file.name.slice(0, 24)}`;
      $('panelPhoto').appendChild(opt);
      $('panelPhoto').value = key;
    });
    input.value = '';
  });
}

function bindCanvasDrag() {
  let dragging = false;
  let lastX = 0, lastY = 0;
  const pos = (e) => {
    const r = preview.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (preview.width / r.width),
      y: (e.clientY - r.top) * (preview.height / r.height),
    };
  };
  preview.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    const i = panelAt(p.x, p.y);
    if (i < 0) return;
    selectPanel(i);
    pushHistory();
    dragging = true;
    lastX = p.x; lastY = p.y;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = pos(e);
    const panel = state.panels[selectedPanel];
    const rects = panelRectsOnPreview();
    const rect = rects[selectedPanel];
    if (!rect) return;
    panel.cx = Math.min(1, Math.max(0, panel.cx - (p.x - lastX) / (rect.w * 1.6)));
    panel.cy = Math.min(1, Math.max(0, panel.cy - (p.y - lastY) / (rect.h * 1.6)));
    lastX = p.x; lastY = p.y;
    render();
  });
  preview.addEventListener('pointerup', () => { dragging = false; });
  preview.addEventListener('pointercancel', () => { dragging = false; });
}

// ---- Export ----

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function slug(text) {
  return (text || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

async function exportSize(sizeId) {
  const size = sizeById(sizeId);
  const canvas = renderCoverToCanvas(size.w, size.h, state, images);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  downloadBlob(blob, `${slug(state.title)}-${size.id}-${size.w}x${size.h}.png`);
  return blob;
}

async function exportAllSizes() {
  for (const id of ['square', 'portrait', 'wide']) {
    await exportSize(id);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// ---- Save / load ----

function saveProject() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    $('saveBtn').textContent = 'Saved ✓';
    setTimeout(() => { $('saveBtn').textContent = 'Save project'; }, 1500);
  } catch (err) {
    $('saveBtn').textContent = 'Save failed';
    setTimeout(() => { $('saveBtn').textContent = 'Save project'; }, 1500);
  }
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.panels)) return false;
    pushHistory();
    Object.assign(state, saved);
    state.panels.forEach((p) => {
      if (!images.has(p.photo)) p.photo = SAMPLES[0].key;
    });
    syncControls();
    render();
    return true;
  } catch (err) {
    return false;
  }
}

// ---- Shots ----

function runShot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  if (q.get('layout')) state.layout = q.get('layout');
  if (q.get('grade')) state.grade = q.get('grade');
  if (q.get('title')) state.title = q.get('title');
  if (q.get('subtitle')) state.subtitle = q.get('subtitle');
  if (q.get('size')) state.size = q.get('size');
  if (q.get('tagline')) state.tagline = q.get('tagline');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.title = `Cover — ${state.title}`;
  }
  return true;
}

// ---- Boot ----

async function boot() {
  buildLayoutGrid();
  buildGradeRow();
  buildSizeRow();
  buildSampleStrip();
  const photoSelect = $('panelPhoto');
  SAMPLES.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.key;
    opt.textContent = s.label;
    photoSelect.appendChild(opt);
  });
  PANEL_FILTERS.forEach((f) => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    $('filterSelect').appendChild(opt);
  });
  bindLettering();
  bindPanelControls();
  bindPhotoUpload();
  bindCanvasDrag();
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('saveBtn').addEventListener('click', saveProject);
  $('loadBtn').addEventListener('click', () => {
    if (loadProject()) {
      $('loadBtn').textContent = 'Loaded ✓';
      setTimeout(() => { $('loadBtn').textContent = 'Load project'; }, 1500);
    }
  });
  $('exportBtn').addEventListener('click', () => exportSize(state.size));
  $('exportAllBtn').addEventListener('click', exportAllSizes);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
  const isShot = runShot();
  syncControls();
  updateUndoButtons();
  await loadSamples();
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('60px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (err) { /* fall back to system fonts */ }
  render();
  window.__viceCoast = {
    state,
    exportSize,
    exportAllSizes,
    undo,
    redo,
    saveProject,
    loadProject,
    selectPanel,
    render,
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.body.classList.add('ready');
  }));
}

boot();
