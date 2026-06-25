# AI-TASK-015

## Prompt summary

Fix Course drag-and-drop, date label bug, and implement course tags.
- Fix Framer Motion `Reorder` component not dragging by tracking primitive stop IDs instead of object references.
- Hide the distance meter between cards during editing to prevent it from dragging along.
- Fix "날짜 미정" displaying on edited API courses by properly parsing dates in `getNextTrip`.
- Implement course tag selection and editing matching the note tag UX, saving tags locally and serializing them for API courses.

## Approved files

- `src/pages/CourseDetailPage.tsx`
- `src/features/course/lib/coursePageModels.ts`
- `src/features/course/components/CourseDiscoveryCard.tsx`
- `.ai/tasks/AI-TASK-015.md`
- `.ai/logs/2026-06-25-AI-TASK-015.md`

## Research notes

- `Reorder.Group` and `Reorder.Item` track items using a value identity check. Since primitive numbers like `stop.id` are stable, passing the array of IDs resolves Framer Motion tracking bugs.
- `apiCourse.description` is used to store course metadata. We can multiplex date and tags as `"YYYY-MM-DD|tag1,tag2"` to persist both safely.

## Plan

1. Modify `CourseDetailPage.tsx`:
   - Bind `Reorder` value to primitive IDs.
   - Conditionally hide `distanceFromPrevious` when editing.
   - Add `editTags` state and horizontal `#tag` editor component in course edit BottomSheet.
   - Update save logic to serialize date and tags.
2. Modify `coursePageModels.ts`:
   - Parse date from new pipe-delimited description in `getNextTrip` for API courses.
   - Sort upcoming trips correctly.
3. Modify `CourseDiscoveryCard.tsx`:
   - Clean date prefix out of hashtags in `getCourseHashtags`.
4. Verify build and lint results.
