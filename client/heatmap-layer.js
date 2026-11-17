/* Framework-neutral density tile cache/renderer. An adapter only needs to call
   getTile(), then renderVisible() whenever the map's visible XYZ set changes. */
const RADIUS_CURVE_VERSION = 'piecewise-z0-15-22-62_5-100-137_5-v5';
const AVERAGE_SUPPORT_VERSION = 'average-support-v1';

function colorForNormalizedDensity(palette, normalized, firstVisibleIndex = -1) {
  const t = Math.max(0, Math.min(1, normalized));
  const scaled = t * (palette.length - 1);
  if (firstVisibleIndex < 0) firstVisibleIndex = palette.findIndex(color => color[3] > 0);
  if (firstVisibleIndex < 0 || t === 0) return [0, 0, 0, 0];
  if (scaled >= firstVisibleIndex) return palette[Math.trunc(scaled)];

  // Smooth leading transparent entries into the first visible color.
  const color = palette[firstVisibleIndex];
  const progress = scaled / firstVisibleIndex;
  const smoothAlpha = progress * progress * (3 - 2 * progress);
  return [color[0], color[1], color[2], Math.trunc(color[3] * smoothAlpha)];
}

export class HeatmapDensityLayer {
  constructor({ baseUrl = '', dataset, mode = 'addition', radius = 27, palette, averageSupportAlpha = true } = {}) {
    this.baseUrl = baseUrl; this.dataset = dataset; this.mode = mode; this.radius = radius;
    this.averageSupportAlpha = averageSupportAlpha;
    this.palette = palette || [[0, 0, 0, 0], [255, 255, 255, 255]];
    this.firstVisibleColorIndex = this.palette.findIndex(color => color[3] > 0);
    this.version = null; this.densityCache = new Map(); this.colorCache = new Map();
  }

  async initialize() {
    const response = await fetch(`${this.baseUrl}/api/datasets/${encodeURIComponent(this.dataset)}`);
    if (!response.ok) throw new Error(await response.text());
    this.version = (await response.json()).version;
    return this;
  }

  identity(z, x, y) { return `${this.dataset}/${this.version}/${z}/${x}/${y}/${this.mode}/r${this.radius}/${RADIUS_CURVE_VERSION}/${AVERAGE_SUPPORT_VERSION}`; }

  async getTile(z, x, y) {
    if (!this.version) await this.initialize();
    const key = this.identity(z, x, y);
    if (this.densityCache.has(key)) return this.densityCache.get(key);
    const pending = fetch(`${this.baseUrl}/api/datasets/${encodeURIComponent(this.dataset)}/tiles/${z}/${x}/${y}?mode=${this.mode}&radius=${this.radius}&curve=${RADIUS_CURVE_VERSION}&support=${AVERAGE_SUPPORT_VERSION}`)
      .then(async response => {
        if (!response.ok) throw new Error(await response.text());
        return this.decode(await response.arrayBuffer(), key, Number(response.headers.get('X-Effective-Radius')));
      });
    this.densityCache.set(key, pending);
    try { return await pending; } catch (error) { this.densityCache.delete(key); throw error; }
  }

  decode(buffer, key, effectiveRadius = this.radius) {
    const view = new DataView(buffer);
    const version = view.getUint8(4);
    if (String.fromCharCode(...new Uint8Array(buffer, 0, 4)) !== 'HMD7' || (version !== 1 && version !== 2)) throw new Error('Unsupported density tile');
    const width = view.getUint16(6, true), height = view.getUint16(8, true);
    const count = width * height, offset = version === 1 ? 20 : 24;
    const hasSupport = version === 2 && (view.getUint8(5) & 1) !== 0;
    return {
      key, width, height, min: view.getFloat32(10, true), max: view.getFloat32(14, true), effectiveRadius,
      values: new Float32Array(buffer, offset, count),
      support: hasSupport ? new Float32Array(buffer, offset + count * 4, count) : null
    };
  }

  // The range is calculated once for the whole visible set, never per tile.
  sharedRange(tiles) {
    let min = this.mode === 'addition' ? 0 : Infinity, max = -Infinity;
    for (const tile of tiles) { if (this.mode !== 'addition') min = Math.min(min, tile.min); max = Math.max(max, tile.max); }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max) || max <= min) max = min + 1;
    return { min, max };
  }

  render(tile, range = { min: 0, max: 1 }) {
    const colorKey = `${tile.key}/${range.min}/${range.max}/${this.averageSupportAlpha}/${JSON.stringify(this.palette)}`;
    if (this.colorCache.has(colorKey)) return this.colorCache.get(colorKey);
    const canvas = document.createElement('canvas'); canvas.width = tile.width; canvas.height = tile.height;
    const context = canvas.getContext('2d'), image = context.createImageData(tile.width, tile.height);
    for (let i = 0; i < tile.values.length; i++) {
      const value = tile.values[i];
      if (!Number.isFinite(value)) continue;
      if (value <= 0) continue;
      const t = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
      const color = colorForNormalizedDensity(this.palette, t, this.firstVisibleColorIndex);
      for (let c = 0; c < 4; c++) image.data[i * 4 + c] = color[c];
      if (this.mode === 'average' && this.averageSupportAlpha && tile.support) {
        image.data[i * 4 + 3] = color[3] * Math.max(0, Math.min(1, tile.support[i]));
      }
    }
    context.putImageData(image, 0, 0); this.colorCache.set(colorKey, canvas); return canvas;
  }

  setColorSettings(palette) {
    this.palette = palette;
    this.firstVisibleColorIndex = palette.findIndex(color => color[3] > 0);
    /* Density cache deliberately retained; the color-cache key includes the palette. */
  }
  setAverageSupportAlpha(enabled) { this.averageSupportAlpha = Boolean(enabled); }
  clearCache() {
    this.densityCache.clear();
    this.colorCache.clear();
  }
  exportPng(canvas) { return canvas.toDataURL('image/png'); }
}
