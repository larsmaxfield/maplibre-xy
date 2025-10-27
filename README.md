# maplibre-xy

Handy functions for <a href=https://github.com/maplibre/maplibre-gl-js>maplibre-gl-js</a> to improve flat single-copy maps, 'simple' maps, and non-maps like high-resolution images.

[Install](#install) by pointing to the repo's `/src/index.js` or (soon) with NPM.

[Features](https://larsmaxfield.com/maplibre-xy/) with code examples:

- [Underzoom](#underzoom): Zoom and pan the map to show the entire bounded area - [HTML example](#html-example)

<p align="center">
<a href="https://larsmaxfield.com/maplibre-xy/examples/underzoom/"><img height="200" width="auto" alt="Underzoom demo with modifiable configuration options scale and pan with different bounds" src="examples/underzoom/preview.png"></a>
</p>

## Install

I'm working on an NPM package.

For now, clone the repo or simply copy the `/src` folder contents. Use `/src/index.js` to access all features.

Or just copy individual modules (like`/src/underzoom.js`) if you need just that.

For a simple HTML page, this is something like:

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

## Features

### Underzoom

Let users see the entire bounded area within defined limits by passing `Underzoom.transformConstrain` to the Map constructor's `transformConstrain` option:

```js
import { Underzoom } from './src/index.js';  // or './src/underzoom.js'

const myUnderzoom = new Underzoom(maplibregl);  // Uses default limits

const map = new maplibregl.Map({
    transformConstrain: myUnderzoom.transformConstrain,
    ...
```

Especially useful for responsibly showing the whole map when `renderWorldCopies=false`.

#### Customize

You can modify the limits by passing an options object. The [underzoom demo](https://larsmaxfield.com/maplibre-xy/examples/underzoom/) lets you preview the effect of each limit on various bounded areas:

```js
const underzoomOptions = {
    // Ratio (0-1) of how you far youcan zoom out
    // the bounds relative to the viewport size.
    extendScale: 0.5,  // Default 0.9

    // Ratio (0-1) of how far you can pan beyond
    // the bounds relative to the distance between
    // viewport edge and center.
    extendPan: 1.0,  // Default 0.2

    // Whether to enable or revert to default
    // Mercator constrain.
    extend: true  // Default true
};

const myUnderzoom = new Underzoom(maplibregl, underzoomOptions);
```

#### HTML example
Assuming you have the `/src` folder available:

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
