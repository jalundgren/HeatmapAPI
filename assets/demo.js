import { HeatmapDensityLayer } from '../../client/heatmap-layer.js';
import { SITE_CONFIG } from '../config.js';

const TILE_SIZE = 256;
const SEGMENT_DIVISORS = [48, 53, 51, 49, 50];
const ALPHA_STEPS = [.51, .5, .87, 1.2, 1.635];
const PALETTES = {
  classic: ['#ffffff', '#ffff33', '#f2be21', '#fe2a00', '#d50243', '#9000ff'],
  aurora: ['#f4fff8', '#8dffcf', '#24d6c8', '#3478d4', '#7040b8', '#24104f'],
  verdant: ['#f4fff0', '#c7f9a9', '#7bdc78', '#2ca25f', '#137547', '#083b32']
};

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function createPalette(colors) {
  const stops = colors.map(rgb), palette = Array.from({ length: 256 }, () => [0, 0, 0, 0]);
  let [red, green, blue] = stops[0], alpha = 240, colorIndex = 255;
  for (let segment = 0; segment < 5; segment++) {
    const increment = [0, 1, 2].map(channel => (stops[segment + 1][channel] - stops[segment][channel]) / SEGMENT_DIVISORS[segment]);
    for (let step = 48; step >= 0; step--) {
      palette[colorIndex--] = [red, green, blue, alpha].map(value => Math.trunc(Math.max(0, Math.min(255, value))));
      red += increment[0]; green += increment[1]; blue += increment[2]; alpha -= ALPHA_STEPS[segment];
    }
  }
  return palette;
}

class PublicHeatmapOverlay extends L.Layer {
  constructor(options) {
    super();
    this.options = options;
    this.density = new HeatmapDensityLayer(options);
    this.generation = 0;
  }

  async onAdd(map) {
    this.map = map;
    this.canvas = L.DomUtil.create('canvas', 'public-heatmap-canvas', map.getContainer());
    this.context = this.canvas.getContext('2d');
    this.canvas.style.opacity = this.options.opacity;
    map.on('move zoom resize', this.schedule, this);
    try {
      await this.density.initialize();
      this.render();
    } catch (error) {
      this.status(`Unable to load HeatMapAPI: ${error.message}`, true);
    }
  }

  onRemove(map) {
    map.off('move zoom resize', this.schedule, this);
    this.canvas.remove();
    this.generation++;
  }

  schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.render());
  }

  visibleTiles() {
    const zoom = this.map.getZoom(), bounds = this.map.getPixelBounds(), worldTiles = 2 ** zoom;
    const min = bounds.min.divideBy(TILE_SIZE).floor(), max = bounds.max.divideBy(TILE_SIZE).floor(), coordinates = [];
    for (let y = Math.max(0, min.y); y <= Math.min(worldTiles - 1, max.y); y++) {
      for (let worldX = min.x; worldX <= max.x; worldX++) {
        coordinates.push({ z: zoom, x: ((worldX % worldTiles) + worldTiles) % worldTiles, y, worldX });
      }
    }
    return { coordinates, bounds };
  }

  async render() {
    if (!this.canvas || !this.density.version) return;
    const generation = ++this.generation, size = this.map.getSize();
    if (this.canvas.width !== size.x || this.canvas.height !== size.y) { this.canvas.width = size.x; this.canvas.height = size.y; }
    const { coordinates, bounds } = this.visibleTiles();
    this.status(`Loading ${coordinates.length} tiles…`);
    try {
      const tiles = await Promise.all(coordinates.map(tile => this.density.getTile(tile.z, tile.x, tile.y)));
      if (generation !== this.generation) return;
      const range = this.density.sharedRange(tiles);
      this.context.clearRect(0, 0, size.x, size.y);
      tiles.forEach((tile, index) => {
        const coordinate = coordinates[index];
        const origin = L.point(coordinate.worldX * TILE_SIZE, coordinate.y * TILE_SIZE).subtract(bounds.min);
        this.context.drawImage(this.density.render(tile, range), origin.x, origin.y);
      });
      this.status(`${tiles.length} tiles · ${this.density.mode} · radius ${tiles[0]?.effectiveRadius.toFixed(1) ?? this.density.radius}px`);
    } catch (error) {
      if (generation === this.generation) this.status(`Tile error: ${error.message}`, true);
    }
  }

  status(message, error = false) {
    const element = document.querySelector('[data-demo-status]');
    element.textContent = message; element.dataset.error = String(error);
  }
}

const map = L.map('public-map', { center: [39.5, -98.35], zoom: 4, minZoom: 2, maxZoom: 18, zoomControl: false });
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const overlay = new PublicHeatmapOverlay({
  baseUrl: SITE_CONFIG.apiBaseUrl,
  dataset: SITE_CONFIG.dataset,
  mode: 'addition', radius: 108, opacity: .82,
  palette: createPalette(PALETTES.classic), averageSupportAlpha: true
}).addTo(map);

const mode = document.querySelector('[data-demo-mode]');
const palette = document.querySelector('[data-demo-palette]');
const radius = document.querySelector('[data-demo-radius]');
const radiusValue = document.querySelector('[data-radius-value]');
mode.addEventListener('change', () => { overlay.density.mode = mode.value; overlay.render(); });
palette.addEventListener('change', () => { overlay.density.setColorSettings(createPalette(PALETTES[palette.value])); overlay.render(); });
radius.addEventListener('input', () => { overlay.density.radius = Number(radius.value); radiusValue.textContent = radius.value; overlay.render(); });
document.querySelector('[data-demo-fade]').addEventListener('change', event => { overlay.density.setAverageSupportAlpha(event.target.checked); overlay.render(); });
document.querySelector('[data-demo-opacity]').addEventListener('input', event => { overlay.canvas.style.opacity = event.target.value; });
