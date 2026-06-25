# AI-TASK-011 — 코스 상세 장소 추가 오버레이 카카오맵 연동

## 요청 요약

코스 상세의 `장소추가하기` 오버레이가 임시 지도형 UI가 아니라 실제 카카오맵을 사용하도록 변경한다.

## 구현 계획

1. `CourseDetailPage.tsx`의 `CoursePlacePickerOverlay`에 카카오맵 컨테이너와 지도 초기화 로직을 추가한다.
2. `loadKakaoMap()` 성공 시 실제 카카오맵을 렌더링한다.
3. 검색/주변 결과를 카카오 커스텀 오버레이 마커로 표시한다.
4. 마커 또는 리스트 항목을 선택하면 선택 상태를 표시하고 지도 중심을 해당 장소로 이동한다.
5. 카카오맵 키 없음/로드 실패 시에만 기존 fallback 지도형 UI를 보여준다.
6. 선택된 장소/쪽지만 `체크한 항목 추가`로 코스 맨 뒤에 추가한다.

## 승인된 변경 파일

- `.ai/tasks/AI-TASK-011.md`
- `.ai/logs/2026-06-25-AI-TASK-011.md`
- `src/pages/CourseDetailPage.tsx`

## 검증

- `npm run build`
