# maplibre-xy

Handy functions for <a href=https://github.com/maplibre/maplibre-gl-js>maplibre-gl-js</a> to improve flat single-copy maps, 'simple' maps, and non-maps like high-resolution images.

See the [features overview](https://larsmaxfield.com/maplibre-xy/) and their individual demos:

- [Underzoom demo](https://larsmaxfield.com/maplibre-xy/examples/underzoom/) - Zoom and pan the map to show the entire bounded area.

## Install

I'm working on an NPM package.

For now, clone the repo or simply copy the `/src` folder contents. Use `/src/index.js` to access all features.

Or just copy individual modules (like`/src/underzoom.js`) if you need just that.

Something like:

```html
<!DOCTYPE html>
...
<head>
    ...
    <script src='https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.js'></script>
</head>
<body>
    <script type="module">
        import { Underzoom } from './src/index.js';  // or './src/underzoom.js'
        ...
    </script>
</body>
</html>
```

## Code examples

### Underzoom

Below is a (hopefully) working example, assuming you have the repo's `/src` folder available.

The [underzoom demo](https://larsmaxfield.com/maplibre-xy/examples/underzoom/) lets you play around with the configuration options with different bounded areas.

```html
<!DOCTYPE html>
<html lang='en'>
<head>
    <title>Underzoom minimal example</title>
    <meta property='og:description' content='Underzoom minimal example' />
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <link rel='stylesheet' href='https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.css' />
    <script src='https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.js'></script>
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        html, body, #map { height: 100%; }
    </style>
</head>
<body>
<div id='map'></div>

<script type="module">
    import { Underzoom } from '../../src/index.js';  // or '../../src/underzoom.js'
    
    const myUnderzoom = new Underzoom(maplibregl, { extendScale: 0.5, extendPan: 1.0 });

    const map = new maplibregl.Map({
        container: 'map',
        renderWorldCopies: false,
        transformConstrain: myUnderzoom.transformConstrain,
        style: {
            version: 8,
            sources: {
                rgb: {
                    type: 'raster',
                    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '&copy; OpenStreetMap Contributors',
                    maxzoom: 19
                },
            },
            layers: [
                {
                    id: 'rgb',
                    type: 'raster',
                    source: 'rgb'
                },
            ]
        },
    });
</script>
</body>
</html>
```

## Contributing

Feature requests, bug reports, and pull requests are always welcome.
