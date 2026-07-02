# AI-TASK-CLEAN-001

## Summary

Split the oversized `CourseDetailPage.tsx` into course detail modules without changing behavior.

## Approved Scope

- `src/pages/CourseDetailPage.tsx`
- `src/features/course/detail/types.ts`
- `src/features/course/detail/courseDetailModels.ts`
- `src/features/course/detail/CourseRouteMap.tsx`
- `src/features/course/detail/CourseRouteDrawer.tsx`
- `src/features/course/detail/courseImageExport.ts`
- `src/features/course/detail/CoursePlacePickerOverlay.tsx`

## Plan

1. Move course detail types and model helpers.
2. Move route map UI.
3. Move route drawer/timeline UI.
4. Move canvas image export helpers.
5. Move course place picker overlay UI.
6. Verify with build and lint.

## Acceptance

- Existing behavior is preserved.
- `CourseDetailPage.tsx` is reduced to page orchestration and sheet logic.
- `npm run build` passes.
- `npm run lint` passes with no new warnings beyond pre-existing warnings.
