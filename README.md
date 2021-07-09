# cesium-drag-and-drop

You can allows your cesium entities to be draggable with less code.

## Getting Started
To install
```
npm install cesium cesium-drag-and-drop
//or
yarn add cesium cesium-drag-and-drop
```

## Demo
![demo](./demo.gif)

## Usage
### Basic
```
//init cesium-drag-and-drop
const viewer = new Cesium.Viewer("cesiumContainer");
const cesiumDnD = new CesiumDnD(viewer);

//Enable drag and drop
cesiumDnD.enableDnD();

//Disable drag and drop
cesiumDnD.disableDnD();
```

### Want to add your function?
If you want to pass your functions to cesium-drag-and-drop, pass them via `options` parameter.

```
//declate your functions which are called when the entity is dragged, being dragged, dropped
const onDrag = (e: Cesium.Entity, position: Position) =>
  console.log(e, position);
const onDragging = (
  e: Cesium.Entity,
  startPosition: Position,
  endPosition: Position
) => console.log(e, startPosition, endPosition);
const onDrop = (e: Cesium.Entity, position: Position) => {
  console.log(e, position);
};

//then, pass them as parameter
const options: Options = {
  onDrag,
  onDrop,
  onDragging,
};

//when you instantiate cesium-drag-and-drop, pass the options as constructor parameters.
const cesiumDnD = new CesiumDnD(viewer, options);
//your functions will be executed when the event occurs
```

The values your functions will recieve are
* Entity
* Position
```
type Position = {
  longitude: number;
  latitude: number;
  height?: number;
};
```

## License
[MIT License](./LICENSE)