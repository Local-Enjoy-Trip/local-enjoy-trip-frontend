# AI-TASK-002

## Prompt Summary

Rework the home course curation and the course page. Course curation should be based on the selected neighborhood. The course page should use a new header with the provided course logo, an add-schedule icon, and a menu. The menu should show my courses, saved places, and saved notes. The main course page should use the latest trip's neighborhood to show separate place and note card carousels, then show other users' courses as hashtag-based carousel sections. For now all courses are treated as public.

## Approved Files

- `.ai/tasks/AI-TASK-002.md`
- `.ai/logs/AI-TASK-002.md`
- `src/assets/courseLogo.svg`
- `src/features/course/components/CourseDiscoveryCard.tsx`
- `src/features/home/components/CourseCurationSection.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/CoursePage.tsx`

## Plan

1. Copy the provided course logo into app assets.
2. Add a reusable course discovery card matching the provided card direction.
3. Make the home course curation section fetch neighborhood-based course feed and render a carousel.
4. Rework the course page header and menu.
5. Use the latest local/API course to derive a neighborhood center.
6. Render separate place and note carousels for that neighborhood.
7. Render public course feed cards grouped by simple hashtags.
8. Preserve course creation access from the add icon.
9. Verify with `npm run build`.

## Risk Notes

- Public feed availability depends on backend data. The UI should fall back to local/mock course data when needed.
- API course items do not always include coordinates, so the latest trip center may fall back to saved local course stops or mock data.
