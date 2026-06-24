# AI-TASK-003 — Heart save API and note UX

## Summary

Connect all heart icons to backend save/unsave APIs and improve note creation/location UX.

## Swagger source

- `http://localhost:8080/v3/api-docs`

## Confirmed save APIs

- `PUT /api/attractions/{id}/save`
- `DELETE /api/attractions/{id}/save`
- `PUT /api/notes/{id}/save`
- `DELETE /api/notes/{id}/save`

## Scope

- Add missing save/unsave helpers.
- Wire map/home place hearts and note hearts.
- Improve the note writing page visual hierarchy and comfort.
- Prevent note location confirmation outside Seoul.
- Run build, lint, and visual QA.

## Notes

- Some note list responses do not expose saved state yet, so note cards start from available data and update optimistically on click.
