# HeatMapAPI Website and Client Example

[HeatMapAPI](https://heatmapapi.com/) provides a way to visualize the density and intensity of latitude/longitude point data on interactive maps, dashboards, and GIS systems.

This `web` folder is the GitHub Pages-ready replacement for the V6 website. It contains:

- A responsive public product and documentation site
- A live Leaflet/OpenStreetMap HeatMapAPI example
- Addition and weighted Average demonstrations
- Palette, radius, opacity, and Average edge-fade controls
- V7 endpoint and client integration examples
- GitHub Pages and custom-domain deployment files

The engineering test client remains in `../client`. Both experiences use the same framework-neutral `client/heatmap-layer.js` implementation.

## What is a heat map?

A heat map is a graphical representation of two-dimensional data using color and intensity. HeatMapAPI works with latitude, longitude, and value records to reveal where activity is concentrated and how values vary geographically.

## Why use a heat map?

- **Clarity:** Replace a sea of individual markers with an understandable density surface.
- **Insight:** Reveal clusters, gradients, hotspots, and regional patterns quickly.
- **Flexibility:** Use the same density data in interactive maps, dashboards, GIS applications, or client-side exports.

## What changed in V7?

V6 accepted point data with each viewport request and returned a server-rendered PNG. V7 uses a tiled, data-first architecture:

1. A configured dataset is loaded once and assigned a content version.
2. A spatial index limits each calculation to relevant source points.
3. The API generates only requested 256×256 XYZ Web Mercator density tiles.
4. Density tiles contain float values rather than server-selected colors.
5. The browser applies palettes and one shared scale across the visible map.
6. Server and browser caches reuse density tiles across repeated views.

This lets users change palettes without recalculating density or downloading a new image. The same dataset version, map tile, mode, radius, and curve settings always produce the same result.

## Aggregation modes

- **Addition:** Sums each point's value weighted by distance. This is useful when nearby records should accumulate into hotspots, such as incidents, events, or activity counts.
- **Average:** Calculates a distance-weighted average of nearby point values. This is useful for measurements such as temperature or other sampled values. V7 can use kernel support as an additional alpha fade so Average-mode boundaries remain soft without changing the calculated averages.

## Dataset format

The current input format is one point per line:

```text
latitude,longitude,value
39.7392,-104.9903,10
```

The included demonstration dataset contains 10,000 repeatable test points in uneven regional clusters across the contiguous United States.

## API example

Inspect a configured dataset:

```http
GET /api/datasets/demo
```

Request an uncolored density tile:

```http
GET /api/datasets/demo/tiles/4/3/6?mode=addition&radius=27
```

See the project-level `../README.md` for the complete density wire format, cache behavior, kernel definition, tests, and local development instructions.

## Local website

From the `HeatmapAPI7` directory:

```sh
dotnet run --project src/HeatmapAPI7 --urls http://localhost:5080
```

Open:

- Public website: `http://localhost:5080/`
- Engineering test client: `http://localhost:5080/test/`
- Dataset metadata: `http://localhost:5080/api/datasets/demo`

## GitHub Pages deployment

Before deploying separately from the API, edit `config.js` and set `apiBaseUrl` to the deployed V7 Cloud Run origin. Leave it empty when ASP.NET serves the website and API from the same origin.

Create a self-contained publication folder:

```sh
node tools/build-github-pages.mjs
```

Publish the generated `dist/` directory as the GitHub Pages root. It contains:

- The public website
- The shared browser density layer
- The `heatmapapi.com` custom-domain `CNAME`
- Redirects for the former `/about.html` and `/web/about.html` example URLs

Do not publish `dist/` until `config.js` contains the deployed V7 URL.

## Retiring V6 online

The new publication bundle is intended to replace the existing V6 GitHub Pages content. Existing public descriptions of the PNG endpoint, `createHeatmap`, client-supplied `DataPoints`, `Width`, `Height`, and viewport bounding-box parameters should not be copied into the V7 site because those contracts are obsolete.

Keep the old repository available through Git history or a tagged V6 branch if historical access is desired. The public site and default branch documentation can then describe V7 exclusively.

## Contact

Contact [jalundgren on GitHub](https://github.com/jalundgren) for questions about hosting HeatMapAPI or implementing commercial solutions.

The project source is available in the [HeatMapAPI GitHub repository](https://github.com/jalundgren/HeatmapAPI).
