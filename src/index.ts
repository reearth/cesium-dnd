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
  SceneMode,
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
  /** The number of milliseconds to wait before starting the drag */
  dragDelay?: number;
  dragInputType?: ScreenSpaceEventType;
  draggingInputType?: ScreenSpaceEventType;
  dropInputType?: ScreenSpaceEventType;
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
  private _initialEnableTranslate = true;
  private _initialPosition?: PositionProperty;
  private _initialHeight?: number | undefined;
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
    this._handler.setInputAction(
      this._handleDrag,
      this.options?.dragInputType ?? ScreenSpaceEventType.LEFT_DOWN,
    );
    this._handler.setInputAction(
      this._handleDragging,
      this.options?.draggingInputType ?? ScreenSpaceEventType.MOUSE_MOVE,
    );
    this._handler.setInputAction(
      this._handleDrop,
      this.options?.dropInputType ?? ScreenSpaceEventType.LEFT_UP,
    );
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
    this.viewer.scene.screenSpaceCameraController.enableTranslate = this._initialEnableTranslate;
    this.viewer.canvas.removeEventListener("blur", this.cancelDragging);
  };

  private _handleDrag = (e: { position: Cartesian2 }) => {
    if (this._entity || this.viewer.isDestroyed() || !e?.position) return;

    const entity = this._pick(e.position);
    if (!entity) return;

    const start = () => {
      if (this._entity || this.viewer.isDestroyed()) return;
      this._timeout = undefined;
      this._initialPosition = entity.position;
      this._initialScreenPosition = e.position.clone();

      const c = entity.position?.getValue(this.viewer.clock.currentTime);
      if (c) {
        const height = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(c).height;
        this._ellipsoid = CesiumDnD.enlargeEllipsoid(this.viewer.scene.globe.ellipsoid, height);

        if (
          this.viewer.scene.mode === SceneMode.SCENE2D ||
          this.viewer.scene.mode === SceneMode.COLUMBUS_VIEW
        ) {
          this._initialHeight = height;
        } else {
          this._initialHeight = undefined;
        }
      }

      const pos = this._resetHeight(this._convertCartesian2ToPosition(e.position));
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
      this._initialEnableTranslate = this.viewer.scene.screenSpaceCameraController.enableTranslate;
      if (this.viewer.scene.mode === SceneMode.SCENE3D) {
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
      } else {
        this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
      }
      this.viewer.canvas.addEventListener("blur", this.cancelDragging);
      entity.position = this._callbackProperty as any;
    };

    window.clearTimeout(this._timeout);
    if (typeof this.options?.dragDelay === "undefined") {
      start();
      return;
    }
    this._timeout = window.setTimeout(start, this.options.dragDelay);
  };

  private _handleDragging = (e: { startPosition: Cartesian2; endPosition: Cartesian2 }) => {
    clearTimeout(this._timeout);
    if (!this._entity || this.viewer.isDestroyed() || !e?.endPosition) return;

    const pos = this._resetHeight(this._convertCartesian2ToPosition(e.endPosition));
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
    if (!this._entity || this.viewer.isDestroyed() || !e?.position) return;

    const entity = this._entity;
    entity.position = this._initialPosition;

    this._position = undefined;
    this._entity = undefined;
    this._timeout = undefined;
    this.viewer.scene.screenSpaceCameraController.enableRotate = this._initialEnableRotate;
    this.viewer.scene.screenSpaceCameraController.enableTranslate = this._initialEnableTranslate;
    this.viewer.canvas.removeEventListener("blur", this.cancelDragging);

    const pos = this._resetHeight(this._convertCartesian2ToPosition(e.position));
    const ctx = this._context(pos, e.position);

    this._initialPosition = undefined;
    this._initialScreenPosition = undefined;
    this._initialHeight = undefined;
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

  private _resetHeight(position: Cartesian3 | undefined): Cartesian3 | undefined {
    if (
      position &&
      (this.viewer.scene.mode === SceneMode.SCENE2D ||
        this.viewer.scene.mode === SceneMode.COLUMBUS_VIEW) &&
      this._initialHeight
    ) {
      const c = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(position);
      return Cartesian3.fromRadians(c.longitude, c.latitude, this._initialHeight);
    }
    return position;
  }

  private static enlargeEllipsoid(e: Ellipsoid, m: number): Ellipsoid {
    return new Ellipsoid(e.radii.x + m, e.radii.y + m, e.radii.z + m);
  }
}
