import "./style.css";
import { Viewer, Cartesian3, Color } from "cesium";
import CesiumDnD from "../../src";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

const viewer = new Viewer("cesium");
viewer.entities.add({
  name: "Example1",
  position: Cartesian3.fromDegrees(-100.0, 40.0, 100000.0),
  box: {
    dimensions: new Cartesian3(500000.0, 500000.0, 500000.0),
    material: Color.AQUA,
    outline: true,
    outlineColor: Color.AQUA,
  },
});
viewer.entities.add({
  name: "Example2",
  position: Cartesian3.fromDegrees(-120.0, 30.0, 1000.0),
  ellipsoid: {
    radii: new Cartesian3(500000.0, 500000.0, 500000.0),
    material: Color.WHITE,
  },
});

new CesiumDnD(viewer, {
  onDrag: (...args) => {
    console.log("drag start -------", ...args);
  },
  onDrop: (...args) => {
    console.log("drop ----", ...args);
  },
  onDragging: (...args) => {
    console.log("dragging ---", ...args);
  },
});
