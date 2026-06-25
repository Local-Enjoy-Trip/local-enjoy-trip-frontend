# AI-TASK-013

## Prompt summary

Improve course stop add map picker behavior in CourseDetailPage:

- Only search and display points after a search query is submitted (disable/remove exploreQuery for performance).
- Constrain map level (zoom out) to level 5 maximum, similar to MapPage.
- Add a floating geolocation (current location) button to the picker map that pans to the user's current GPS location.

## Approved files

- `src/pages/CourseDetailPage.tsx`
- `.ai/tasks/AI-TASK-013.md`
- `.ai/logs/2026-06-25-AI-TASK-013.md`

## Research notes

- `CoursePlacePickerOverlay` in `CourseDetailPage.tsx` currently pre-fetches map items in Seoul using `exploreQuery` even before the user searches. This degrades performance as it fetches and renders many markers initially.
- The map zoom level is currently initialized to 5. We should call `map.setMaxLevel(5)` to prevent zooming out further.
- Currently, there is no GPS current location button in `CoursePlacePickerOverlay`.
- We can import `useCurrentLocation` from `@/shared/hooks/useCurrentLocation` (which is already used in `MapPage.tsx`) to request the user's GPS coordinates and pan the map center to it.

## Plan

1. **Disable exploreQuery**: Remove or disable `exploreQuery` from `CoursePlacePickerOverlay`. Modify the `points` useMemo to only evaluate `searchQuery.data` when `isSearching` is true.
2. **Limit zoom level**: Add `map.setMaxLevel(5)` to the Kakao Map initialization inside the `useEffect` of `CoursePlacePickerOverlay`.
3. **Add Geolocation state and button**:
   - Use the `useCurrentLocation` hook in `CoursePlacePickerOverlay`.
   - Add a floating button (using Lucide's `Crosshair` icon) on the map area.
   - When clicked, call `requestLocation()`.
   - When location state updates successfully, pan the map center (`map.panTo`) to the current location coordinates.
4. **Build & Lint Verification**:
   - Run `npm run build` to verify there are no compilation errors.

## Risks

- None identified. Geolocation requires secure contexts, which is already handled via helper checks.
