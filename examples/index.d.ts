import { Viewer } from 'cesium';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
