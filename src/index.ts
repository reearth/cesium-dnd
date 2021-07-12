import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Entity,
  Math as CesiumMath,
  PositionProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
} from "cesium";

export type Position = {
  longitude: number;
  latitude: number;
  height?: number;
};

export type Options = {
  onDrag?: (e: Entity, position?: Position) => void | boolean;
  onDragging?: (e: Entity, position?: Position) => void;
  onDrop?: (e: Entity, position?: Position) => void;
};

export default class CesiumDnD {
  viewer: Viewer;
  options?: Options;

  private _timeout?: number;
  private _handler?: ScreenSpaceEventHandler;
  private _initialEnableRotate = true;
  private _entity?: Entity;
  private _initialPosition?: PositionProperty;
  private _position: Cartesian3 | undefined;
  private _callbackProperty = new CallbackProperty(
    () => this._position ?? this._initialPosition,
    false,
  );

  constructor(viewer: Viewer, options?: Options) {
    this.viewer = viewer;
    this.options = options;
    this.enable();
  }

  get isDragging() {
    return !!this._entity;
  }

  enable() {
    this._handler = new ScreenSpaceEventHandler(this.viewer.canvas);
    this._handler.setInputAction(this._handleDrag.bind(this), ScreenSpaceEventType.LEFT_DOWN);
    this._handler.setInputAction(this._handleDragging.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
    this._handler.setInputAction(this._handleDrop.bind(this), ScreenSpaceEventType.LEFT_UP);
  }

  disable() {
    this._cancelDrop();
    this._handler?.destroy();
    this._handler = undefined;
  }

  get isActive() {
    return !this._handler;
  }

  private _handleDrag(e: { position: Cartesian2 }) {
    if (this._entity || this.viewer.isDestroyed()) return;

    const entity = this._pick(e.position);
    if (!entity) return;

    window.clearTimeout(this._timeout);
    this._timeout = window.setTimeout(() => {
      if (this._entity || this.viewer.isDestroyed()) return;
      this._timeout = undefined;

      const pos = this._convertCartesian2ToPosition(e.position);
      if (this.options?.onDrag?.(entity, pos) === false) return;

      this._entity = entity;
      this._initialPosition = entity.position;
      this._initialEnableRotate = this.viewer.scene.screenSpaceCameraController.enableRotate;
      this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      this.viewer.canvas.addEventListener("blur", this._cancelDrop);

      this._position = pos
        ? Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height)
        : undefined;
      entity.position = this._callbackProperty as any;
    }, 200);
  }

  private _handleDragging(e: { startPosition: Cartesian2; endPosition: Cartesian2 }) {
    clearTimeout(this._timeout);
    if (!this._entity || this.viewer.isDestroyed()) return;

    const pos = this._convertCartesian2ToPosition(e.endPosition);
    if (pos) {
      this._position = Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height);
    }

    this.options?.onDragging?.(this._entity, pos);
  }

  private _handleDrop(e: { position: Cartesian2 }) {
    clearTimeout(this._timeout);
    if (!this._entity || this.viewer.isDestroyed()) return;

    const entity = this._entity;
    const pos = this._convertCartesian2ToPosition(e.position);
    if (pos) {
      entity.position = Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height) as any;
    } else {
      entity.position = this._initialPosition;
    }

    this._position = undefined;
    this._entity = undefined;
    this._initialPosition = undefined;
    this._timeout = undefined;
    this.viewer.scene.screenSpaceCameraController.enableRotate = this._initialEnableRotate;
    this.viewer.canvas.removeEventListener("blur", this._cancelDrop);

    this.options?.onDrop?.(entity, pos);
  }

  private _cancelDrop = () => {
    clearTimeout(this._timeout);

    if (this._entity) {
      this._entity.position = this._initialPosition;
    }

    this._entity = undefined;
    this._initialPosition = undefined;
    this._timeout = undefined;
    this.viewer.scene.screenSpaceCameraController.enableRotate = this._initialEnableRotate;
    this.viewer.canvas.removeEventListener("blur", this._cancelDrop);
  };

  private _pick(position: Cartesian2): Entity | undefined {
    return this.viewer.scene.pick(position)?.id;
  }

  private _convertCartesian2ToPosition(position: Cartesian2): Position | undefined {
    const cartesian = this.viewer.scene.camera.pickEllipsoid(
      new Cartesian2(position.x, position.y),
      this.viewer.scene.globe.ellipsoid,
    );
    if (!cartesian) return;

    const {
      latitude,
      longitude,
      height,
    } = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    return {
      latitude: CesiumMath.toDegrees(latitude),
      longitude: CesiumMath.toDegrees(longitude),
      height: CesiumMath.toDegrees(height),
    };
  }
}
