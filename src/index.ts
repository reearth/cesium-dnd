import {
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  CesiumWidget,
  Ellipsoid,
  Entity,
  PositionProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
} from "cesium";

export type Context = {
  position?: Cartesian3;
  screenPosition: Cartesian2;
  initialPosition?: PositionProperty;
  initialScreenPosition: Cartesian2;
};

export type Options = {
  /** If true, prevent dnd to be automatically enabled. */
  initialDisabled?: boolean;
  /** If false is returned, dragging will not start. */
  onDrag?: (e: Entity, position: Cartesian3 | undefined, context: Context) => void | boolean;
  /**
   * If undefined is returned, new position will be automatically set to the entity. (default)
   * If false is returned, new position will not be set to the entity.
   * Otherwise, the return value will be set as new position to the entity.
   */
  onDragging?: (
    e: Entity,
    position: Cartesian3 | undefined,
    context: Context & { previousScreenPosition: Cartesian2 },
  ) => void | false | Cartesian3;
  /**
   * If false is returned, new position will not be set to the entity and position of the entity will be reverted.
   * Otherwise, new position will be automatically set to the entity.
   */
  onDrop?: (e: Entity, position: Cartesian3 | undefined, context: Context) => void | boolean;
};

export default class CesiumDnD {
  viewer: Viewer | CesiumWidget;
  options?: Options;

  private _timeout?: number;
  private _handler?: ScreenSpaceEventHandler;
  private _initialEnableRotate = true;
  private _initialPosition?: PositionProperty;
  private _initialScreenPosition?: Cartesian2;
  private _entity?: Entity;
  private _position: Cartesian3 | undefined;
  private _ellipsoid?: Ellipsoid;
  private _callbackProperty = new CallbackProperty(
    () => this._position ?? this._initialPosition,
    false,
  );

  constructor(viewer: Viewer | CesiumWidget, options?: Options) {
    this.viewer = viewer;
    this.options = options;
    if (!options?.initialDisabled) {
      this.enable();
    }
  }

  get isDragging() {
    return !!this._entity;
  }

  enable() {
    this._handler = new ScreenSpaceEventHandler(this.viewer.canvas);
    this._handler.setInputAction(this._handleDrag, ScreenSpaceEventType.LEFT_DOWN);
    this._handler.setInputAction(this._handleDragging, ScreenSpaceEventType.MOUSE_MOVE);
    this._handler.setInputAction(this._handleDrop, ScreenSpaceEventType.LEFT_UP);
  }

  disable() {
    this.cancelDragging();
    this._handler?.destroy();
    this._handler = undefined;
  }

  get isActive() {
    return !!this._handler;
  }

  cancelDragging = () => {
    clearTimeout(this._timeout);

    if (this._entity) {
      this._entity.position = this._initialPosition;
    }

    this._entity = undefined;
    this._initialPosition = undefined;
    this._initialScreenPosition = undefined;
    this._timeout = undefined;
    this.viewer.scene.screenSpaceCameraController.enableRotate = this._initialEnableRotate;
    this.viewer.canvas.removeEventListener("blur", this.cancelDragging);
  };

  private _handleDrag = (e: { position: Cartesian2 }) => {
    if (this._entity || this.viewer.isDestroyed()) return;

    const entity = this._pick(e.position);
    if (!entity) return;

    window.clearTimeout(this._timeout);
    this._timeout = window.setTimeout(() => {
      if (this._entity || this.viewer.isDestroyed()) return;
      this._timeout = undefined;
      this._initialPosition = entity.position;
      this._initialScreenPosition = e.position.clone();

      const c = entity.position?.getValue(this.viewer.clock.currentTime);
      if (c) {
        const height = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(c).height;
        this._ellipsoid = CesiumDnD.enlargeEllipsoid(this.viewer.scene.globe.ellipsoid, height);
      }

      const pos = this._convertCartesian2ToPosition(e.position);
      const ctx = this._context(pos, e.position);
      if (ctx && this.options?.onDrag?.(entity, pos, ctx) === false) {
        this._initialPosition = undefined;
        this._initialScreenPosition = undefined;
        this._ellipsoid = undefined;
        return;
      }

      this._position = pos;
      this._entity = entity;
      this._initialEnableRotate = this.viewer.scene.screenSpaceCameraController.enableRotate;
      this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      this.viewer.canvas.addEventListener("blur", this.cancelDragging);
      entity.position = this._callbackProperty as any;
    }, 200);
  };

  private _handleDragging = (e: { startPosition: Cartesian2; endPosition: Cartesian2 }) => {
    clearTimeout(this._timeout);
    if (!this._entity || this.viewer.isDestroyed()) return;

    const pos = this._convertCartesian2ToPosition(e.endPosition);
    const ctx = this._context(pos, e.endPosition);
    if (!ctx) return;

    const newPos = this.options?.onDragging?.(this._entity, pos, {
      ...ctx,
      previousScreenPosition: e.startPosition,
    });
    if (newPos === false) return;

    if (typeof newPos !== "undefined") {
      this._position = newPos;
    } else if (pos) {
      this._position = pos;
    }
  };

  private _handleDrop = (e: { position: Cartesian2 }) => {
    clearTimeout(this._timeout);
    if (!this._entity || this.viewer.isDestroyed()) return;

    const entity = this._entity;
    entity.position = this._initialPosition;

    this._position = undefined;
    this._entity = undefined;
    this._timeout = undefined;
    this.viewer.scene.screenSpaceCameraController.enableRotate = this._initialEnableRotate;
    this.viewer.canvas.removeEventListener("blur", this.cancelDragging);

    const pos = this._convertCartesian2ToPosition(e.position);
    const ctx = this._context(pos, e.position);

    this._initialPosition = undefined;
    this._initialScreenPosition = undefined;
    this._ellipsoid = undefined;

    if (ctx && this.options?.onDrop?.(entity, pos, ctx) !== false && pos) {
      entity.position = pos as any;
    }
  };

  private _pick(position: Cartesian2): Entity | undefined {
    return this.viewer.scene.pick(position)?.id;
  }

  private _context(
    position: Cartesian3 | undefined,
    screenPosition: Cartesian2,
  ): Context | undefined {
    if (!this._initialScreenPosition) return;
    return {
      position,
      screenPosition,
      initialPosition: this._initialPosition,
      initialScreenPosition: this._initialScreenPosition,
    };
  }

  private _convertCartesian2ToPosition(position: Cartesian2): Cartesian3 | undefined {
    return this.viewer.scene.camera.pickEllipsoid(
      position,
      this._ellipsoid ?? this.viewer.scene.globe.ellipsoid,
    );
  }

  private static enlargeEllipsoid(e: Ellipsoid, m: number): Ellipsoid {
    return new Ellipsoid(e.radii.x + m, e.radii.y + m, e.radii.z + m);
  }
}
