import type { Coordinates, LocalNote, Place } from "@/shared/types/domain";

export type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

export type KakaoPoint = {
  x: number;
  y: number;
};

export type KakaoMapProjection = {
  containerPointFromCoords: (latlng: KakaoLatLng) => KakaoPoint;
  coordsFromContainerPoint: (point: KakaoPoint) => KakaoLatLng;
};

export type KakaoBounds = {
  contain: (latlng: KakaoLatLng) => boolean;
};

export type KakaoMapInstance = {
  getBounds: () => KakaoBounds;
  getLevel: () => number;
  getProjection: () => KakaoMapProjection;
  panTo: (latlng: KakaoLatLng) => void;
  relayout: () => void;
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number, options?: { anchor?: KakaoLatLng }) => void;
};

export type KakaoCustomOverlay = {
  setMap: (map: KakaoMapInstance | null) => void;
  setZIndex: (zIndex: number) => void;
};

export type KakaoPolyline = {
  setMap: (map: KakaoMapInstance | null) => void;
};

export type KakaoMaps = {
  CustomOverlay: new (options: {
    content: HTMLElement;
    position: KakaoLatLng;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number }
  ) => KakaoMapInstance;
  Point: new (x: number, y: number) => KakaoPoint;
  Polyline: new (options: {
    path: KakaoLatLng[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "shortdot" | "dash" | "dot" | "longdash" | "dashdot" | "longdashdot";
    strokeWeight?: number;
  }) => KakaoPolyline;
  event: {
    addListener: (
      target: KakaoMapInstance,
      type: "idle" | "zoom_changed",
      handler: () => void
    ) => void;
    removeListener: (
      target: KakaoMapInstance,
      type: "idle" | "zoom_changed",
      handler: () => void
    ) => void;
  };
  load: (callback: () => void) => void;
};

export type MapPoint =
  | {
      id: string;
      kind: "place";
      name: string;
      coordinates: Coordinates;
      saved: boolean;
      source: Place;
    }
  | {
      id: string;
      kind: "spot";
      name: string;
      authorName: string;
      authorAvatarUrl?: string;
      coordinates: Coordinates;
      saved: boolean;
      source: LocalNote;
    };

export type MarkerCluster = {
  id: string;
  center: Coordinates;
  points: MapPoint[];
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMaps;
    };
  }
}
