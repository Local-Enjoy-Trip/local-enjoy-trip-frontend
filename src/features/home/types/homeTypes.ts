export type HomeLocationOption = {
  label: HomeLocation;
  weatherArea: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

export const homeLocations = [
  "장안동",
  "회기동",
  "휘경동",
  "망원동",
  "성수동",
  "을지로",
] as const;

export type HomeLocation = (typeof homeLocations)[number];

export const homeLocationOptions = [
  {
    label: "장안동",
    weatherArea: "서울특별시 동대문구 장안동",
    coordinates: { lat: 37.5677, lng: 127.0663 },
  },
  {
    label: "회기동",
    weatherArea: "서울특별시 동대문구 회기동",
    coordinates: { lat: 37.5906, lng: 127.0557 },
  },
  {
    label: "휘경동",
    weatherArea: "서울특별시 동대문구 휘경동",
    coordinates: { lat: 37.5892, lng: 127.0658 },
  },
  {
    label: "망원동",
    weatherArea: "서울특별시 마포구 망원동",
    coordinates: { lat: 37.5568, lng: 126.9019 },
  },
  {
    label: "성수동",
    weatherArea: "서울특별시 성동구 성수동",
    coordinates: { lat: 37.5446, lng: 127.0557 },
  },
  {
    label: "을지로",
    weatherArea: "서울특별시 중구 을지로",
    coordinates: { lat: 37.5663, lng: 126.9918 },
  },
] as const satisfies readonly HomeLocationOption[];

export type HomeNote = {
  createdAt?: string;
  id: string;
  name: string;
  location: string;
  body: string;
  place: string;
  image?: string;
  profileImage?: string;
};
