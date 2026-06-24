# AI-TASK-003

## Prompt Summary

Refine the course page layout after AI-TASK-002. Shrink the header, base the hero and recommendations on the next dated trip, change section copy, group public course carousels by popular hashtags in pairs, restore the course creation panel in the page body, and add a floating upcoming-trip image button that expands into a horizontal trip panel.

## Approved Files

- `.ai/tasks/AI-TASK-003.md`
- `.ai/logs/AI-TASK-003.md`
- `src/pages/CoursePage.tsx`

## Plan

1. Update header sizing and spacing.
2. Change trip selection from latest saved course to nearest upcoming dated course.
3. Render `n일 뒤` as the accent-colored part of the hero line.
4. Remove the `내 최근 코스` carousel.
5. Rename the place recommendation section.
6. Add the course creation panel back into the body.
7. Group public course sections by two popular non-area hashtags.
8. Add a bottom-right floating representative-image button and expanded trip panel.
9. Verify with build and lint.

## Notes

- API courses do not currently expose a trip date, so next-trip selection can only use locally saved courses with `date`.
- If no dated future trip exists, the page falls back to the most recently saved/local course or a default neighborhood.
