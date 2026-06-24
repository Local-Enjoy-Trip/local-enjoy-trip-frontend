# AI-TASK-004

## Prompt Summary

Refactor the oversized course page into reusable components and model helpers while preserving the current behavior.

## Approved Files

- `.ai/tasks/AI-TASK-004.md`
- `.ai/logs/AI-TASK-004.md`
- `src/pages/CoursePage.tsx`
- `src/features/course/components/CoursePageHeader.tsx`
- `src/features/course/components/CourseCreatePanel.tsx`
- `src/features/course/components/CourseCarousel.tsx`
- `src/features/course/components/CourseMenuSheet.tsx`
- `src/features/course/components/UpcomingTripPanel.tsx`
- `src/features/course/components/CourseRecommendationCarousels.tsx`
- `src/features/course/lib/coursePageModels.ts`

## Plan

1. Move page model helpers to `coursePageModels.ts`.
2. Extract header, creation panel/sheet, course carousel, recommendation carousels, menu sheet, and upcoming trip panel.
3. Reduce `CoursePage.tsx` to data fetching, state wiring, and layout composition.
4. Verify with build and lint.
