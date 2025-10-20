function mercatorYfromLat(lat) {
    return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
}

function zoomScale(zoom) {
    return Math.pow(2, zoom);
}

function scaleZoom(scale) {
    return Math.log(scale) / Math.LN2;
}

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

function wrap(n, min, max) {
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
}

function mercatorXfromLng(lng) {
    return (180 + lng) / 360;
}

const MAX_VALID_LATITUDE = 85.051129;

function projectToWorldCoordinates(worldSize, lnglat) {
    const lat = clamp(lnglat.lat, -MAX_VALID_LATITUDE, MAX_VALID_LATITUDE);
    return new maplibregl.Point(
        mercatorXfromLng(lnglat.lng) * worldSize,
        mercatorYfromLat(lat) * worldSize);
}

function unprojectFromWorldCoordinates(worldSize, point) {
    return new maplibregl.MercatorCoordinate(point.x / worldSize, point.y / worldSize).toLngLat();
}

let _extend = true;
let _extendScalePercent = 70; 
let _extendPanPercent = 0;

function underzoomTransformConstrain(lngLat, zoom) {
    zoom = clamp(+zoom, this.minZoom, this.maxZoom);
    const result = {
        center: new maplibregl.LngLat(lngLat.lng, lngLat.lat),
        zoom
    };

    let lngRange = this.lngRange;

    if (!this.renderWorldCopies && lngRange === null) {
        const almost180 = 180 - 1e-10;
        lngRange = [-almost180, almost180];
    }

    const worldSize = this.tileSize * zoomScale(result.zoom); // A world size for the requested zoom level, not the current world size
    let minY = 0;
    let maxY = worldSize;
    let minX = 0;
    let maxX = worldSize;
    let scaleY = 0;
    let scaleX = 0;
    const {x: screenWidth, y: screenHeight} = this.size;

    const underzoom =  // 0-1 (percent as normalized factor of viewport minimum dimension)
        _extend ?
            clamp(_extendScalePercent, 0, 100) / 100 :
            1.0;

    if (this.latRange) {
        const latRange = this.latRange;
        minY = mercatorYfromLat(latRange[1]) * worldSize;
        maxY = mercatorYfromLat(latRange[0]) * worldSize;
        const shouldZoomIn = maxY - minY < (underzoom * screenHeight);
        if (shouldZoomIn) scaleY = underzoom * screenHeight / (maxY - minY);
    }

    if (lngRange) {
        minX = wrap(
            mercatorXfromLng(lngRange[0]) * worldSize,
            0,
            worldSize
        );
        maxX = wrap(
            mercatorXfromLng(lngRange[1]) * worldSize,
            0,
            worldSize
        );

        if (maxX < minX) maxX += worldSize;

        // const xDiff = parseFloat((maxX - minX).toFixed(9))
        // const xScreen = parseFloat((underzoom * screenWidth).toFixed(9))
        // const shouldZoomIn = xDiff < xScreen;
        const shouldZoomIn = maxX - minX < (underzoom * screenWidth);
        if (shouldZoomIn) scaleX = underzoom * screenWidth / (maxX - minX);
    }

    const {x: originalX, y: originalY} = projectToWorldCoordinates(worldSize, lngLat);
    let modifiedX, modifiedY;

    const scale =
        _extend ?
            Math.min(scaleX || 0, scaleY || 0) :
            Math.max(scaleX || 0, scaleY || 0);

    if (scale) {
        // zoom in to exclude all beyond the given lng/lat ranges
        const newPoint = new maplibregl.Point(
            scaleX ? (maxX + minX) / 2 : originalX,
            scaleY ? (maxY + minY) / 2 : originalY);
        result.center = unprojectFromWorldCoordinates(worldSize, newPoint).wrap();
        result.zoom += scaleZoom(scale);
        return result;
    }

    // Panning up and down in latitude is externally limited by project() with MAX_VALID_LATITUDE.
    // This limit prevents panning the top and bottom bounds farther than the center of the viewport.
    // Due to the complexity and consequence of altering project() or MAX_VALID_LATITUDE, we'll simply limit
    // the overpan to 50% the bounds to match that external limit.
    let lngOverpan = 0.0;
    let latOverpan = 0.0;
    if (_extend) {
        const overpan = clamp(_extendPanPercent, 0, 100) / 100;  // 0-1 (percent as a normalized factor from viewport edge to center)
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
            wrappedX = wrap(originalX, centerX - worldSize / 2, centerX + worldSize / 2);
        }
        const w2 = lngPanScale * screenWidth / 2;

        if (wrappedX - w2 < minX) modifiedX = minX + w2;
        if (wrappedX + w2 > maxX) modifiedX = maxX - w2;
    }

    // pan the map if the screen goes off the range
    if (modifiedX !== undefined || modifiedY !== undefined) {
        const newPoint = new maplibregl.Point(modifiedX ?? originalX, modifiedY ?? originalY);
        result.center = unprojectFromWorldCoordinates(worldSize, newPoint).wrap();
    }

    return result;
};

function identityTransformConstrain(lngLat, zoom) {
    return {center: lngLat, zoom: zoom ?? 0};
};
