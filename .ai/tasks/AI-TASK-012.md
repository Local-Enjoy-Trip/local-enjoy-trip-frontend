# AI-TASK-012

## Prompt summary

Improve public course detail behavior from the home popular course section:

- Confirm whether home neighborhood popular courses use API data.
- Make popular course card navigation reliable.
- For other users' course detail pages, hide owner-only actions and provide an "add to my course" flow.
- Let users choose an existing course or create a new course, then add all stops from the viewed course.
- Redesign the course stop list to match the AI recommendation result card style while preserving distance labels.
- Save the course detail as a vertical image using that list style.

## Approved files

- `src/pages/CourseDetailPage.tsx`
- `src/features/course/courseApi.ts`
- `src/features/course/courseStorage.ts`
- `src/features/course/components/CourseDiscoveryCard.tsx`
- `.ai/tasks/AI-TASK-012.md`
- `.ai/logs/2026-06-25-AI-TASK-012.md`

## Research notes

- Home neighborhood courses are loaded by `getCourseFeed()` through `/api/courses/feed`, with local saved-course fallback.
- Course cards link to `/course/:courseId`, but feed results were not cached before navigation.
- The detail page already has owner-only edit actions and a simple public-course copy action, but it only creates one local copy immediately.
- Existing image export draws a plain SVG list rather than matching the AI recommendation result card style.

## Plan

1. Cache API feed courses before navigating to detail so the detail page can render immediately.
2. Extend local course storage with a multi-stop append helper.
3. Add reusable stop metadata for card rendering and image export.
4. Replace the route list item UI with the AI recommendation-style card while keeping distance labels.
5. Replace one-click public course copy with a bottom sheet that supports existing local/API courses and new-course creation.
6. Update image export to generate a vertical card-list PNG.
7. Run `npm run build`; run `npm run lint` when feasible.

## Risks

- API course items may not include attraction/note IDs, so API-target append/create may fail for incomplete server data.
- API course items do not expose per-place images, so API detail cards use the course cover image as a fallback.
- Existing unrelated working tree changes must be preserved.
