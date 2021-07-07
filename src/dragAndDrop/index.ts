import * as Cesium from 'cesium';
import Cartesian2 from 'cesium/Source/Core/Cartesian2';

export type Position = {
  longitude: number;
  latitude: number;
  height?: number;
};

export type Options = {
  onDrag?: (e: Cesium.Entity, position: Position) => void;
  onDragging?: (
    e: Cesium.Entity,
    startPosition?: Position,
    endPosition?: Position
  ) => void;
  onDrop?: (e: Cesium.Entity, position: Position) => void;
};

class CesiumDnD {
  viewer: Cesium.Viewer;
  options?: Options;
  handler: Cesium.ScreenSpaceEventHandler;
  entity: Cesium.Entity | null;
  mousePos: Cesium.Cartesian2;
  mousePosProperty: any;
  private isDragging: boolean;
  private ellipsoid: Cesium.Ellipsoid;
  private onDrag: (e: any) => void;
  private onDragging: (e: any) => void;
  private onDrop: (e: any) => void;
  private getLatLng: (position: Cesium.Cartesian2) => Position | undefined;
  constructor(viewer: Cesium.Viewer, options?: Options) {
    this.viewer = viewer;
    this.options = options;
    this.entity = null;
    this.mousePos = new Cesium.Cartesian2();
    this.mousePosProperty = new Cesium.CallbackProperty((_time, result) => {
      const ellipsoid = this.viewer.scene.globe.ellipsoid;
      const pos = this.viewer.scene.camera.pickEllipsoid(
        this.mousePos,
        ellipsoid,
        result
      );
      if (!pos) return;
      const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);
      return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartographic);
    }, false);
    this.isDragging = false;
    this.ellipsoid = this.viewer.scene.globe.ellipsoid;
    this.onDrag = this.handleDrag.bind(this);
    this.onDragging = this.handleDragging.bind(this);
    this.onDrop = this.handleDrop.bind(this);
    this.getLatLng = this.convertCartesian2ToPosition.bind(this);
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
  }

  enableDnD() {
    this.handler.setInputAction(
      this.onDrag,
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    );
    this.handler.setInputAction(
      this.onDragging,
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
    this.handler.setInputAction(
      this.onDrop,
      Cesium.ScreenSpaceEventType.LEFT_UP
    );
  }

  disableDnD() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  isDnDActive(): boolean {
    const isDnDActive =
      !!this.handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN) &&
      !!this.handler.getInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE) &&
      !!this.handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    return isDnDActive;
  }

  private handleDrag(e: { position: Cesium.Cartesian2 }) {
    const pickedObj = this.viewer.scene.pick(e.position);
    if (!Cesium.defined(pickedObj)) return;

    this.isDragging = true;
    this.entity = pickedObj?.id;
    if (!this.entity) return;
    Cesium.Cartesian2.clone(e.position, this.mousePos);
    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    this.entity.position = this.mousePosProperty;
    const cartographicPos = this.getLatLng(e.position);
    if (!cartographicPos) return;
    this.entity && this.options?.onDrag?.(this.entity, cartographicPos);
  }

  private handleDragging(e: {
    startPosition: Cesium.Cartesian2;
    endPosition: Cesium.Cartesian2;
  }) {
    if (!this.isDragging || !this.entity) return;
    Cesium.Cartesian2.clone(e.endPosition, this.mousePos);
    const cartographicPos = this.getLatLng(e.endPosition);
    this.options?.onDragging?.(this.entity, cartographicPos);
  }

  private handleDrop(e: { position: Cesium.Cartesian2 }) {
    this.isDragging = false;
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    if (!this.entity) return;
    const newPos = this.viewer.scene.camera.pickEllipsoid(e.position);
    if (newPos) {
      this.entity.position = new Cesium.ConstantPositionProperty(newPos);
    }
    const cartographicPos = this.getLatLng(e.position);
    if (!cartographicPos) return;
    this.options?.onDrop?.(this.entity, cartographicPos);
    this.entity = null;
  }

  private convertCartesian2ToPosition(
    position: Cesium.Cartesian2
  ): Position | undefined {
    const cartesian = this.viewer.scene.camera.pickEllipsoid(
      new Cartesian2(position.x, position.y),
      this.ellipsoid
    );
    if (!cartesian) return undefined;
    const {
      latitude,
      longitude,
      height,
    } = this.ellipsoid.cartesianToCartographic(cartesian);
    return {
      latitude: Cesium.Math.toDegrees(latitude),
      longitude: Cesium.Math.toDegrees(longitude),
      height: Cesium.Math.toDegrees(height),
    };
  }
}

export default CesiumDnD;
