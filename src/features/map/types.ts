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
  getNorthEast: () => KakaoLatLng;
  getSouthWest: () => KakaoLatLng;
};

export type KakaoMapInstance = {
  getBounds: () => KakaoBounds;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  getProjection: () => KakaoMapProjection;
  panTo: (latlng: KakaoLatLng) => void;
  relayout: () => void;
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number, options?: { anchor?: KakaoLatLng }) => void;
  setMaxLevel: (level: number) => void;
};

export type KakaoCustomOverlay = {
  setMap: (map: KakaoMapInstance | null) => void;
  setZIndex: (zIndex: number) => void;
};

export type KakaoPolygon = {
  setMap: (map: KakaoMapInstance | null) => void;
  setOptions: (options: {
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
  }) => void;
};

export type KakaoPolyline = {
  setMap: (map: KakaoMapInstance | null) => void;
};

export type KakaoAddressResult = {
  address?: {
    address_name: string;
  };
  road_address?: {
    address_name: string;
  } | null;
};

export type KakaoRegionResult = {
  address_name: string;
  region_3depth_name: string;
  region_type: "B" | "H";
};

export type KakaoPlaceResult = {
  address_name?: string;
  place_name: string;
  road_address_name?: string;
  x: string;
  y: string;
};

export type KakaoServicesStatus = {
  OK: string;
  ZERO_RESULT: string;
  ERROR: string;
};

export type KakaoMaps = {
  CustomOverlay: new (options: {
    content: HTMLElement;
    map?: KakaoMapInstance;
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
  Polygon: new (options: {
    fillColor?: string;
    fillOpacity?: number;
    map?: KakaoMapInstance;
    path: KakaoLatLng[] | KakaoLatLng[][];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "shortdot" | "dash" | "dot";
    strokeWeight?: number;
  }) => KakaoPolygon;
  Polyline: new (options: {
    path: KakaoLatLng[];
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "shortdot" | "dash" | "dot" | "longdash" | "dashdot" | "longdashdot";
    strokeWeight?: number;
  }) => KakaoPolyline;
  services?: {
    Geocoder: new () => {
      coord2Address: (
        lng: number,
        lat: number,
        callback: (
          result: KakaoAddressResult[],
          status: string
        ) => void
      ) => void;
      coord2RegionCode: (
        lng: number,
        lat: number,
        callback: (
          result: KakaoRegionResult[],
          status: string
        ) => void
      ) => void;
    };
    Places: new () => {
      keywordSearch: (
        keyword: string,
        callback: (
          result: KakaoPlaceResult[],
          status: string
        ) => void
      ) => void;
    };
    Status: KakaoServicesStatus;
  };
  event: {
    addListener: (
      target: KakaoMapInstance | KakaoPolygon,
      type: "click" | "idle" | "zoom_changed",
      handler: () => void
    ) => void;
    removeListener: (
      target: KakaoMapInstance | KakaoPolygon,
      type: "click" | "idle" | "zoom_changed",
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

export type MapViewport = {
  center: Coordinates;
  radiusMeters: number;
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
