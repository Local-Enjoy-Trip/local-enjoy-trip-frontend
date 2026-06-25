# AI-TASK-014

## Prompt summary

AI 코스 추천 백엔드 연동 (/api/courses/ai-generate):
- 취향 입력을 기반으로 AI가 관광지로 구성된 코스를 생성하고 저장 전 미리보기 형태로 반환.
- 프론트엔드 취향 질문 선택 값을 백엔드 API 명세에 맞춰 매핑하여 연동.

## Approved files

- `src/features/course/courseApi.ts`
- `src/pages/CreateCoursePage.tsx`
- `.ai/tasks/AI-TASK-014.md`
- `.ai/logs/2026-06-25-AI-TASK-014.md`

## Research notes

- **API Endpoint**: `POST /api/courses/ai-generate`
- **Request Parameters**:
  - `sidoCode`: `number` (Seoul is `1`)
  - `gugunCode`: `number` (Mapped from selected neighborhood, e.g. 망원동 -> 14)
  - `companion`: `"ALONE" | "WITH_FRIEND" | "WITH_PARTNER" | "WITH_CHILD" | "WITH_PARENTS" | "WITH_PET"`
  - `themes`: `array` of `"FOOD" | "CAFE" | "WALK" | "CULTURE" | "NATURE" | "PHOTO" | "MARKET" | "SHOPPING"`
  - `pace`: `"RELAXED" | "MODERATE" | "PACKED"`
- **Response Format**:
  - Contains `title` and `stops` (where each stop has `attractionId`, `title`, `addr1`, `firstImage`).
  - Coordinate details (`latitude` and `longitude`) are not returned in the preview and will be resolved by the backend when the course is saved and loaded in `CourseDetailPage`.

## Plan

1. **Modify `courseApi.ts`**:
   - Define typescript enums/types for request and response.
   - Add `generateAiCourse` API function.
2. **Modify `CreateCoursePage.tsx`**:
   - Update `AiCourseCreator` state to hold `recommendation` in React state instead of local mock generation.
   - Replace the mock 1.8s timer with the actual `generateAiCourse` async API call when loading phase is triggered.
   - Map selection values to API properties:
     - Neighborhoods to `gugunCode` values.
     - Companions to enums.
     - Themes to enums.
     - Paces to enums.
   - Map returned `StopPreview` stops to the local `SavedCourseStop` structure.
   - Implement retry/error handling.
3. **Build & Lint Verification**:
   - Verify build with `npm run build` and `npm run lint`.

## Risks

- Backend service should be running locally (at `http://localhost:8080`) to test the integration.
