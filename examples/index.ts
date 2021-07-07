import * as Cesium from 'cesium';

import CesiumDnD from '../.';
import type {Options, Position} from "../.";

if (typeof window !== 'undefined') {
  window.CESIUM_BASE_URL = '/cesium/';
}

(function() {
  'use strict';
  const viewer = new Cesium.Viewer('cesium');
  viewer.entities.add({
    name: 'Example1',
    position: Cesium.Cartesian3.fromDegrees(-100.0, 40.0, 100000.0),
    box: {
      dimensions: new Cesium.Cartesian3(500000.0, 500000.0, 500000.0),
      material: Cesium.Color.AQUA,
      outline: true,
      outlineColor: Cesium.Color.AQUA,
    },
  });
  viewer.entities.add({
    name: 'Example2',
    position: Cesium.Cartesian3.fromDegrees(-120.0, 30.0, 1000.0),
    ellipsoid: {
      radii: new Cesium.Cartesian3(500000.0, 500000.0, 500000.0),
      material: Cesium.Color.WHITE,
    },
  });

  const onDrag = (e: Cesium.Entity, position: Position) =>
    console.log('position -------', e, position);
  const onDragging = (
    e: Cesium.Entity,
    startPosition: Position,
    endPosition: Position
  ) => console.log('dragging---', e, startPosition, endPosition);
  const onDrop = (e: Cesium.Entity, position: Position) => {
    console.log('drop ----', e, position);
  };
  const options: Options = {
    onDrag: onDrag,
    onDrop: onDrop,
    onDragging: onDragging,
  };
  const cesiumDnD = new CesiumDnD(viewer, options);
  cesiumDnD.enableDnD();
})();
