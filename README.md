# cesium-dnd

cesium-dnd makes Cesium entities draggable with less code. [Demo](https://reearth.github.io/cesium-dnd/)

![Screenshot](./demo.gif)

## Getting Started

To install:

```sh
npm install cesium cesium-dnd
# or
yarn add cesium cesium-dnd
```

Or

```html
<script src="https://unpkg.com/cesium-dnd@1.0.0/dist/cesiumdnd.umd.production.min.js"></script>
<script>
  const viewer = new Cesium.Viewer("cesiumContainer");
  new CesiumDnD(viewer);
</script>
```

## Usage

```js
// Init cesium-dnd
const viewer = new Cesium.Viewer("cesiumContainer");

const cesiumDnD = new CesiumDnD(viewer, { // CesiumWidget is also acceptable
  initialDisabled: false,
  onDrag: (entity, position, context) => {
    // ...
  },
  onDragging: (entity, position, context) => {
    // ...
  },
  onDrop: (entity, position, context) => {
    // ...
  }
});

// Disable drag and drop
cesiumDnD.disable();

// Enable drag and drop
cesiumDnD.enable();
```

```ts
type Context = {
  position?: Cartesian3;
  screenPosition: Cartesian2;
  initialPosition?: PositionProperty;
  initialScreenPosition: Cartesian2;
};

type Position = {
  /** Degrees */
  lat: number;
  /** Degrees */
  lng: number;
  /** Meters */
  height: number;
};

type Options = {
  /** If true, prevent dnd to be automatically enabled. */
  initialDisabled?: boolean;
  /** If false is returned, dragging will not start. */
  onDrag?: (e: Entity, position: Position | undefined, context: Context) => void | boolean;
  /**
   * If undefined is returned, new position will be automatically set to the entity. (default)
   * If false is returned, new position will not be set to the entity.
   * Otherwise, the return value will be set as new position to the entity.
   */
  onDragging?: (
    e: Entity,
    position: Position | undefined,
    context: Context & { previousScreenPosition: Cartesian2 },
  ) => void | false | Cartesian3;
  /**
   * If false is returned, new position will not be set to the entity and position of the entity will be reverted.
   * Otherwise, new position will be automatically set to the entity.
   */
  onDrop?: (e: Entity, position: Position | undefined, context: Context) => void | boolean;
};
```

## License
[MIT License](./LICENSE)
