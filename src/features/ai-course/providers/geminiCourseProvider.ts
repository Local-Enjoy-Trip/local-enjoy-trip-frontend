import { generateAiCourse } from "@/features/course/courseApi";
import { parseAiCoursePreviewResponse } from "../schemas/courseResponseSchema";
import type { AiCourseProvider } from "../types";

export const geminiCourseProvider: AiCourseProvider = {
  name: "server-ai",
  async generate(request) {
    const preview = parseAiCoursePreviewResponse(await generateAiCourse(request));

    return {
      preview,
      source: "server",
    };
  },
};
