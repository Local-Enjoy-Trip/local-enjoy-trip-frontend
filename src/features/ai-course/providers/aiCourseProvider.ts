import type { AiCourseProvider } from "../types";
import { geminiCourseProvider } from "./geminiCourseProvider";
import { mockCourseProvider } from "./mockCourseProvider";

const providerMode = import.meta.env.VITE_AI_COURSE_PROVIDER?.trim().toLowerCase();

export function getAiCourseProvider(): AiCourseProvider {
  if (providerMode === "mock" || providerMode === "fallback") {
    return mockCourseProvider;
  }

  return geminiCourseProvider;
}

export function getFallbackCourseProvider(): AiCourseProvider {
  return mockCourseProvider;
}
