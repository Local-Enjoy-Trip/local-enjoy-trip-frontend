import type { Coordinates } from "@/shared/types/domain";
import type { KakaoLatLng, KakaoMaps } from "@/features/map/types";

type Position = [lng: number, lat: number];
type PolygonCoordinates = Position[][];
type MultiPolygonCoordinates = PolygonCoordinates[];

export type SeoulAdministrativeDong = {
  type: "Feature";
  properties: {
    adm_cd2: string;
    adm_nm: string;
    sggnm: string;
  };
  geometry: {
    type: "MultiPolygon";
    coordinates: MultiPolygonCoordinates;
  };
};

type SeoulAdministrativeDongCollection = {
  type: "FeatureCollection";
  baseDate: string;
  features: SeoulAdministrativeDong[];
};

let administrativeDongsPromise: Promise<SeoulAdministrativeDong[]> | null = null;

export function loadSeoulAdministrativeDongs() {
  if (!administrativeDongsPromise) {
    administrativeDongsPromise = fetch(
      "/data/seoul-administrative-dongs.geojson"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("서울 행정동 경계를 불러오지 못했습니다.");
        }

        return response.json() as Promise<SeoulAdministrativeDongCollection>;
      })
      .then((collection) => collection.features)
      .catch((error) => {
        administrativeDongsPromise = null;
        throw error;
      });
  }

  return administrativeDongsPromise;
}

export function getAdministrativeDongName(dong: SeoulAdministrativeDong) {
  const addressParts = dong.properties.adm_nm.trim().split(/\s+/);
  return addressParts[addressParts.length - 1] ?? "선택한 동네";
}

function getRingArea(ring: Position[]) {
  return ring.reduce((area, [lng, lat], index) => {
    const [nextLng, nextLat] = ring[(index + 1) % ring.length];
    return area + lng * nextLat - nextLng * lat;
  }, 0) / 2;
}

function getLargestOuterRing(dong: SeoulAdministrativeDong) {
  return dong.geometry.coordinates
    .map((polygon) => polygon[0])
    .filter((ring): ring is Position[] => Boolean(ring?.length))
    .sort((a, b) => Math.abs(getRingArea(b)) - Math.abs(getRingArea(a)))[0];
}

export function getAdministrativeDongCenter(
  dong: SeoulAdministrativeDong
): Coordinates {
  const ring = getLargestOuterRing(dong);

  if (!ring?.length) {
    return { lat: 37.5665, lng: 126.978 };
  }

  const signedArea = getRingArea(ring);

  if (Math.abs(signedArea) < Number.EPSILON) {
    const totals = ring.reduce(
      (sum, [lng, lat]) => ({ lat: sum.lat + lat, lng: sum.lng + lng }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: totals.lat / ring.length,
      lng: totals.lng / ring.length,
    };
  }

  const weighted = ring.reduce(
    (sum, [lng, lat], index) => {
      const [nextLng, nextLat] = ring[(index + 1) % ring.length];
      const cross = lng * nextLat - nextLng * lat;

      return {
        lat: sum.lat + (lat + nextLat) * cross,
        lng: sum.lng + (lng + nextLng) * cross,
      };
    },
    { lat: 0, lng: 0 }
  );
  const divisor = 6 * signedArea;

  return {
    lat: weighted.lat / divisor,
    lng: weighted.lng / divisor,
  };
}

export function getAdministrativeDongPaths(
  dong: SeoulAdministrativeDong,
  kakaoMaps: KakaoMaps
): KakaoLatLng[][][] {
  return dong.geometry.coordinates.map((polygon) =>
    polygon.map((ring) =>
      ring.map(([lng, lat]) => new kakaoMaps.LatLng(lat, lng))
    )
  );
}
