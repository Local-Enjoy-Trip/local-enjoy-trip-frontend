import type { CourseItemResponse } from "@/features/course/courseApi";
import type { Coordinates } from "@/shared/types/domain";

export type CourseStop = {
  id: number;
  accent: "violet" | "coral" | "mint";
  category: string;
  coordinates: Coordinates;
  description: string;
  distanceFromPrevious?: string;
  imageUrl: string;
  location: string;
  sourceItem?: CourseItemResponse;
  title: string;
};
