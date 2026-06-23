import { useCallback, useState } from "react";
import type { Coordinates } from "../types/domain";

type LocationState =
  | { status: "idle"; coordinates: null; error: null }
  | { status: "loading"; coordinates: null; error: null }
  | { status: "success"; coordinates: Coordinates; error: null }
  | { status: "error"; coordinates: null; error: string };

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    coordinates: null,
    error: null
  });

  const requestLocation = useCallback(() => {
    if (!window.isSecureContext) {
      setState({
        status: "error",
        coordinates: null,
        error: "휴대폰에서 현재 위치를 사용하려면 HTTPS 연결이 필요해요."
      });
      return;
    }

    if (!navigator.geolocation) {
      setState({
        status: "error",
        coordinates: null,
        error: "이 브라우저에서는 위치 기능을 사용할 수 없어요."
      });
      return;
    }

    setState({ status: "loading", coordinates: null, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        if (!isInKorea(coordinates)) {
          setState({
            status: "error",
            coordinates: null,
            error: "현재 위치가 서비스 지역 밖으로 잡혀 기본 동네 기준으로 보여드릴게요."
          });
          return;
        }

        setState({
          status: "success",
          coordinates,
          error: null
        });
      },
      () => {
        setState({
          status: "error",
          coordinates: null,
          error: "위치 권한을 허용하면 근처 쪽지를 볼 수 있어요."
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { ...state, requestLocation };
}

function isInKorea({ lat, lng }: Coordinates) {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}
