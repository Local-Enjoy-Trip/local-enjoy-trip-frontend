# AI-TASK-002 — Course API integration

## Summary

Integrate the frontend course screens with the backend Swagger course API.

## Swagger source

- `http://localhost:8080/v3/api-docs`
- Local backend source cross-check: `../local-enjoy-trip-backend/docs/api/courses.md`

## Confirmed endpoints

- `GET /api/courses/me`
- `GET /api/courses/{id}`
- `GET /api/courses/feed`
- `POST /api/courses`
- `PUT /api/courses/{id}`
- `POST /api/courses/{id}/order-recommendation`
- `DELETE /api/courses/{id}`

## Scope

- Add a course API adapter.
- Use backend courses on the course list.
- Use backend or cached course detail on the course detail page.
- Use backend order recommendation from the AI route organization action.
- Preserve the local mock AI recommendation flow as a fallback when generated stops have no backend `attractionId`/`noteId`.

## Risk notes

- Swagger `CourseItemResponse` does not include latitude/longitude/image/category, so the current visual map needs fallback coordinates and display labels.
- `POST /api/courses` requires course items backed by `attractionId` or `noteId`; current AI-generated mock places do not have those IDs.
