/**
 * Class with a custom {@link transformConstrain} to underzoom a MapLibre map.
 * @example
 * ```js
 * import { Underzoom } from './src/index.js';  // or './src/underzoom.js'
 * const myUnderzoom = new Underzoom(maplibregl, { extendScale: 90, extendPan: 20 });
 * const map = new maplibregl.Map({
 *     container: 'map',
 *     renderWorldCopies: false,
 *     transformConstrain: myUnderzoom.transformConstrain,
 *     ...
 * });
 * ```
 */
export class Underzoom {
    /**
     * The custom transformConstrain callback to pass to the maplibregl.Map constructor options.
     * @readonly
     * @type {maplibregl.TransformConstrainFunction}
     */
    transformConstrain;

    static #MAX_VALID_LATITUDE = 85.051129;

    static #mercatorYfromLat(lat) {
        return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
    }

    static #zoomScale(zoom) {
        return Math.pow(2, zoom);
    }

    static #scaleZoom(scale) {
        return Math.log(scale) / Math.LN2;
    }

    static #clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    static #wrap(n, min, max) {
        const d = max - min;
        const w = ((n - min) % d + d) % d + min;
        return (w === min) ? max : w;
    }

    static #mercatorXfromLng(lng) {
        return (180 + lng) / 360;
    }

    static #projectToWorldCoordinates(worldSize, lnglat, maplibregl) {
        const lat = Underzoom.#clamp(lnglat.lat, -Underzoom.#MAX_VALID_LATITUDE, Underzoom.#MAX_VALID_LATITUDE);
        return new maplibregl.Point(
            Underzoom.#mercatorXfromLng(lnglat.lng) * worldSize,
            Underzoom.#mercatorYfromLat(lat) * worldSize);
    }

    static #unprojectFromWorldCoordinates(worldSize, point, maplibregl) {
        return new maplibregl.MercatorCoordinate(point.x / worldSize, point.y / worldSize).toLngLat();
    }

    /**
     * Creates an Underzoom instance.
     * @param {object} maplibregl - The global maplibregl object.
     * @param {object} [options] - Configuration options.
     * @param {number} [options.extendScale=0.9] - The ratio (0-1) of how you far you can zoom out the bounds relative to the viewport size.
     * @param {number} [options.extendPan=0.2] - The ratio (0-1) of how far you can pan beyond the bounds relative to the distance between viewport edge and center.
     * @param {boolean} [options.extend=true] - Whether to enable or revert to default Mercator constrain.
     */
    constructor(maplibregl, { extendScale = 0.9, extendPan = 0.2, extend = true } = {}) {
        if (!maplibregl || !maplibregl.Point || !maplibregl.LngLat || !maplibregl.MercatorCoordinate) {
            throw new Error("Invalid maplibregl object in Underzoom constructor.");
        }

        this.extendScale = extendScale;
        this.extendPan = extendPan;
        this.extend = extend;

        const thisInstance = this;  // Avoid 'this' conflict in transformConstrain
        const mlgl = maplibregl;

        /**
         * The custom transformConstrain callback to pass to the maplibregl.Map constructor options.
         * This is a copy of MapLibre's MercatorTransform.defaultConstrain adapted to support underzooming.
         */
        this.transformConstrain = function(lngLat, zoom) {
            zoom = Underzoom.#clamp(+zoom, this.minZoom, this.maxZoom);
            const result = {
                center: new mlgl.LngLat(lngLat.lng, lngLat.lat),
                zoom
            };

            let lngRange = this.lngRange;

            if (!this.renderWorldCopies && lngRange === null) {
                const almost180 = 180 - 1e-10;
                lngRange = [-almost180, almost180];
            }

            const worldSize = this.tileSize * Underzoom.#zoomScale(result.zoom); // A world size for the requested zoom level, not the current world size
            let minY = 0;
            let maxY = worldSize;
            let minX = 0;
            let maxX = worldSize;
            let scaleY = 0;
            let scaleX = 0;
            const {x: screenWidth, y: screenHeight} = this.size;

            const underzoom =
                thisInstance.extend ?
                    Underzoom.#clamp(thisInstance.extendScale, 0, 1) :
                    1.0;

            if (this.latRange) {
                const latRange = this.latRange;
                minY = Underzoom.#mercatorYfromLat(latRange[1]) * worldSize;
                maxY = Underzoom.#mercatorYfromLat(latRange[0]) * worldSize;
                const shouldZoomIn = maxY - minY < (underzoom * screenHeight);
                if (shouldZoomIn) scaleY = underzoom * screenHeight / (maxY - minY);
            }

            if (lngRange) {
                minX = Underzoom.#wrap(
                    Underzoom.#mercatorXfromLng(lngRange[0]) * worldSize,
                    0,
                    worldSize
                );
                maxX = Underzoom.#wrap(
                    Underzoom.#mercatorXfromLng(lngRange[1]) * worldSize,
                    0,
                    worldSize
                );

                if (maxX < minX) maxX += worldSize;

                const shouldZoomIn = maxX - minX < (underzoom * screenWidth);
                if (shouldZoomIn) scaleX = underzoom * screenWidth / (maxX - minX);
            }

            const {x: originalX, y: originalY} = Underzoom.#projectToWorldCoordinates(worldSize, lngLat, mlgl);
            let modifiedX, modifiedY;

            const scale =
                thisInstance.extend ?
                    Math.min(scaleX || 0, scaleY || 0) :
                    Math.max(scaleX || 0, scaleY || 0);

            if (scale) {
                const newPoint = new mlgl.Point(
                    scaleX ? (maxX + minX) / 2 : originalX,
                    scaleY ? (maxY + minY) / 2 : originalY);
                result.center = Underzoom.#unprojectFromWorldCoordinates(worldSize, newPoint, mlgl).wrap();
                result.zoom += Underzoom.#scaleZoom(scale);
                return result;
            }

            // Panning up and down in latitude is externally limited by project() with MAX_VALID_LATITUDE.
            // This limit prevents panning the top and bottom bounds farther than the center of the viewport.
            // Due to the complexity and consequence of altering project() or MAX_VALID_LATITUDE, we'll simply limit
            // the overpan to 50% the bounds to match that external limit.
            let lngOverpan = 0.0;
            let latOverpan = 0.0;
            if (thisInstance.extend) {
                const overpan = Underzoom.#clamp(thisInstance.extendPan, 0, 1);
                const latUnderzoomMinimumPan = 1.0 - ((maxY - minY) / screenHeight);
                const lngUnderzoomMinimumPan = 1.0 - ((maxX - minX) / screenWidth);
                lngOverpan = Math.max(lngUnderzoomMinimumPan, overpan);
                latOverpan = Math.max(latUnderzoomMinimumPan, overpan);
            }
            const lngPanScale = 1.0 - lngOverpan;
            const latPanScale = 1.0 - latOverpan;

            if (this.latRange) {
                const h2 = latPanScale * screenHeight / 2;
                if (originalY - h2 < minY) modifiedY = minY + h2;
                if (originalY + h2 > maxY) modifiedY = maxY - h2;
            }

            if (lngRange) {
                const centerX = (minX + maxX) / 2;
                let wrappedX = originalX;
                if (this.renderWorldCopies) {
                    wrappedX = Underzoom.#wrap(originalX, centerX - worldSize / 2, centerX + worldSize / 2);
                }
                const w2 = lngPanScale * screenWidth / 2;

                if (wrappedX - w2 < minX) modifiedX = minX + w2;
                if (wrappedX + w2 > maxX) modifiedX = maxX - w2;
            }

            // pan the map if the screen goes off the range
            if (modifiedX !== undefined || modifiedY !== undefined) {
                const newPoint = new mlgl.Point(modifiedX ?? originalX, modifiedY ?? originalY);
                result.center = Underzoom.#unprojectFromWorldCoordinates(worldSize, newPoint, mlgl).wrap();
            }

            return result;
        };
    }
}