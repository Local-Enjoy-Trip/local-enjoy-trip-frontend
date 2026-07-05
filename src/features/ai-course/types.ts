import type {
  AiCourseCompanion,
  AiCourseGenerateRequest,
  AiCoursePace,
  AiCoursePreviewResponse,
  AiCourseTheme,
} from "@/features/course/courseApi";

export type AiCourseProviderSource = "server" | "mock" | "fallback";

export type AiCourseProviderResult = {
  preview: AiCoursePreviewResponse;
  source: AiCourseProviderSource;
  notice?: string;
};

export type AiCourseProvider = {
  generate: (request: AiCourseGenerateRequest) => Promise<AiCourseProviderResult>;
  name: string;
};

export type GenerateCourseInput = AiCourseGenerateRequest & {
  areaLabel: string;
  companionLabel: string;
  paceLabel: string;
  styleLabels: string[];
  version: number;
};

export type GeneratedCourseStop = {
  attractionId?: number;
  category: string;
  description: string;
  id: number;
  imageUrl: string;
  lat: number;
  lng: number;
  noteId?: number;
  placeIdMatched: boolean;
  title: string;
};

export type GeneratedCourse = {
  area: string;
  collaborators: string[];
  companion: string;
  id: string;
  notice?: string;
  pace: string;
  savedAt: string;
  source: AiCourseProviderSource;
  stops: GeneratedCourseStop[];
  styles: string[];
  title: string;
};

export type { AiCourseCompanion, AiCoursePace, AiCourseTheme };
