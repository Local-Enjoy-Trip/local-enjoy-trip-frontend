export const homeLocations = ["장안1동", "망원동", "성수동", "을지로"] as const;

export type HomeLocation = (typeof homeLocations)[number];

export type HomeNote = {
  id: string;
  name: string;
  location: string;
  body: string;
  place: string;
  image?: string;
};
