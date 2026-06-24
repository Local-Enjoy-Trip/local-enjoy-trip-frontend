# AI-TASK-002 log

## Prompt summary

User asked to inspect Swagger at `http://localhost:8080/swagger-ui/index.html#/` and integrate the course API.

## Swagger/API inspection

- Initial sandboxed `curl` to `localhost:8080` failed due local TCP sandbox restrictions.
- Escalated read-only `curl -sS http://localhost:8080/v3/api-docs` succeeded.
- Extracted course paths and schemas from OpenAPI JSON.

## Files inspected

- `src/shared/api/http.ts`
- `src/features/map/mapApi.ts`
- `src/features/friends/friendApi.ts`
- `src/pages/CoursePage.tsx`
- `src/pages/CreateCoursePage.tsx`
- `src/pages/CourseDetailPage.tsx`
- `src/features/course/courseStorage.ts`
- `../local-enjoy-trip-backend/docs/api/courses.md`
- `../local-enjoy-trip-backend/core/core-api/src/main/java/com/ssafy/enjoytrip/core/api/web/controller/CourseController.java`
- Backend course request/response DTOs

## Files changed

- `.ai/tasks/AI-TASK-002.md`
- `src/features/course/courseApi.ts`
- `src/features/course/courseStorage.ts`
- `src/pages/CoursePage.tsx`
- `src/pages/CreateCoursePage.tsx`
- `src/pages/CourseDetailPage.tsx`

## Implementation notes

- Added a Swagger-shaped course API adapter.
- Course list now loads `GET /api/courses/me`, caches API courses, and falls back to local temporary courses on failure.
- Course detail now uses cached/API course data when available and keeps local/mock fallback behavior.
- AI route organization now calls `POST /api/courses/{id}/order-recommendation` for API-backed courses and saves the accepted order with `PUT /api/courses/{id}`.
- AI recommendation save now attempts `POST /api/courses` first and falls back to local temporary storage if backend item IDs are unavailable or the create call fails.

## Known constraints

- Swagger `CourseItemResponse` does not expose coordinates, image URL, or category. Detail map uses stable generated coordinates around the course start location/default route.
- `POST /api/courses` requires items with `attractionId` or `noteId`. Mock AI recommendations include candidate attraction IDs, but backend data may reject them; fallback storage keeps the UX working.
- Collaborator/friend sharing still has no course collaboration API in Swagger, so it remains local UI state for now.

## Commands run

- `curl -sS http://localhost:8080/v3/api-docs`
- `npm run build`
- `npm run lint`
- `git diff --check`

## Verification result

- Build: passed
- Lint: passed with one existing Fast Refresh warning in `src/features/map/components/MapListCard.tsx`
- Diff whitespace check: passed
