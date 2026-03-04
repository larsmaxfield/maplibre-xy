# maplibre-xy

![NPM Downloads](https://img.shields.io/npm/dy/maplibre-xy)

```bash
npm install maplibre-xy
```

Utilities for <a href=https://github.com/maplibre/maplibre-gl-js>maplibre-gl-js</a> to improve flat single-copy maps and non-maps like high-resolution image tilesets.

<p align="center">
    <a href="https://larsmaxfield.com/maplibre-xy/examples/underzoom/">
        <img height="200" width="auto" alt="Underzoom demo with modifiable configuration options scale and pan with different bounds" src="examples/underzoom/preview.png">
    </a>
</p>
<p align="center">
    <a href="https://larsmaxfield.com/maplibre-xy/examples/underzoom/">
        Demo
    </a>
    for
    <a href="#underzoom">
        Underzoom
    </a>
</p>

## Features

See the [features preview](https://larsmaxfield.com/maplibre-xy/) on the homepage:

- [Underzoom](#underzoom): View the entire bounded area regardless of viewport aspect ratio.

## Install

With [NPM](https://www.npmjs.com/package/maplibre-xy):

```bash
npm install maplibre-xy
```
```js
import { Underzoom } from 'maplibre-xy'
```

From the UNPKG content delivery network (CDN):

```js
import { Underzoom } from 'https://unpkg.com/maplibre-xy';
```

From the repo source:

```js
import { Underzoom } from './src/index.js';
```

## Use

### Underzoom

Let users zoom out to see the entire bounded area regardless of viewport aspect ratio.

<p align="center">
    <a href="https://larsmaxfield.com/maplibre-xy/examples/underzoom/">
        <img height="200" width="auto" alt="Underzoom demo with modifiable configuration options scale and pan with different bounds" src="examples/underzoom/preview.png">
    </a>
</p>
<p align="center">
    <a href="https://larsmaxfield.com/maplibre-xy/examples/underzoom/">
        Demo
    </a>
</p>

Simply create an `Underzoom` instance and pass its `transformConstrain` to the Map constructor's `transformConstrain` option. The transform extends the allowable zoom and pan to [customizable](#customize) limits:

```js
import { Underzoom } from 'maplibre-xy';  // NPM
// or
import { Underzoom } from 'https://unpkg.com/maplibre-xy';  // UNPKG

const myUnderzoom = new Underzoom(maplibregl);  // Use default limits

const map = new maplibregl.Map({
    transformConstrain: myUnderzoom.transformConstrain,
    ...
```

This is especially useful when `renderWorldCopies=false` if you want to show the whole map on both mobile (a tall viewport) and desktop (a wide viewport). MapLibre's default Mercator transform doesn't allow this.

#### [Minimal HTML example](./examples/underzoom/minimal.html)

#### Customize

You can modify the Underzoom limits by passing an options object and/or setting its properties. The [underzoom demo](https://larsmaxfield.com/maplibre-xy/examples/underzoom/) lets you preview the effect extending scale ane pan on various bounded areas:

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

myUnderzoom.extendScale = 1.0;
myUnderzoom.extendPan = 0.0;  
myUnderzoom.extend = false;
```

## Contributing

Feature requests, bug reports, and pull requests are always welcome.
