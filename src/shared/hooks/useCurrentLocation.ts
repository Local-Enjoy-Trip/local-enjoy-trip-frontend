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
        setState({
          status: "success",
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
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
