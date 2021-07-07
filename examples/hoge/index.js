import CesiumDnD from '../../dist/drag';
// import CesiumDnD from "./"
const viewer = new Cesium.Viewer('cesiumContainer');
viewer.entities.add({
  name: 'Red box with black outlin',
  position: Cesium.Cartesian3.fromDegrees(-107.0, 40.0, 300000.0),
  box: {
    dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
    material: Cesium.Color.RED,
    outline: true,
    outlineColor: Cesium.Color.BLACK,
  },
});
viewer.entities.add({
  name: 'Blue box with black outlin',
  position: Cesium.Cartesian3.fromDegrees(-116.0, 40.0, 300000.0),
  box: {
    dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
    material: Cesium.Color.BLUE,
    outline: true,
    outlineColor: Cesium.Color.BLACK,
  },
});

CesiumDnD(viewer);
// class Drag {
//   constructor(viewer) {
//     this._viewer = viewer;
//     this.entity = null;
//     this.handler = null;
//     this.moving = false;

//     this._leftDown = this._leftDownHandler.bind(this);
//     this._leftUp = this._leftUpHandler.bind(this);
//     this._move = this._moveHandler.bind(this);

//     this.handler = new Cesium.ScreenSpaceEventHandler(this._viewer.canvas);
//   }

//   enable() {
//     this.handler.setInputAction(
//       this._leftDown,
//       Cesium.ScreenSpaceEventType.LEFT_DOWN
//     );

//     this.handler.setInputAction(
//       this._leftUp,
//       Cesium.ScreenSpaceEventType.LEFT_UP
//     );

//     this.handler.setInputAction(
//       this._move,
//       Cesium.ScreenSpaceEventType.MOUSE_MOVE
//     );
//   }

//   disable() {
//     this._viewer.scene.screenSpaceCameraController.enableRotate = true;

//     this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
//     this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
//     this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);

//     this.moving = false;
//     this.entity = null;
//   }

//   _leftDownHandler(e) {
//     this.entity = this._viewer.scene.pick(e.position);
//     console.log('entity --------', this.entity);
//     this.moving = true;
//     if (this.entity) {
//       this._viewer.scene.screenSpaceCameraController.enableRotate = false;
//     }
//   }

//   _leftUpHandler() {
//     this.moving = false;
//     this.entity = null;
//     this._viewer.scene.screenSpaceCameraController.enableRotate = true;
//   }

//   _moveHandler(e) {
//     if (this.moving && this.entity) {
//       const ray = this._viewer.camera.getPickRay(e.endPosition);
//       console.log('ray --------', ray);
//       const cartesian = this._viewer.scene.globe.pick(ray, this._viewer.scene);
//       console.log('cartesian --------', cartesian);
//       this.entity.id.position = new Cesium.CallbackProperty(function() {
//         return cartesian;
//       }, false);
//     }
//   }
// }

// const cesiumDnD = new Drag(viewer);
// cesiumDnD.enable();
