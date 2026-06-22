# AI-TASK-008 — 공개 쪽지와 친구 쪽지 지도 경험 분리

## 요청 요약

지도 필터의 `SPOT`을 `쪽지`로 변경하고, 공개 쪽지와 친구 쪽지를 의미·마커·리스트에서 분리한다. 공개 쪽지는 사진과 카테고리 태그 마커로, 친구 쪽지는 프로필 사진이 들어간 키 컬러 핀으로 표시한다. 쪽지 목록은 작성자, 지역, 작성 시각, 사진, 본문, 찜 상태를 읽을 수 있는 전용 카드로 변경한다.

## 조사 기준

- 공개 쪽지: `visibility === "public"`
- 친구 쪽지: `relationshipToViewer === "friend"`
- 쪽지 이미지: 지도 API의 `imageObjectKey`
- 작성 시각: 지도 API의 `createdAt`
- 실제 카카오 지도와 키 없는 대체 지도에서 동일한 의미 체계를 사용한다.

## 구현 계획

1. 쪽지 도메인에 작성 시각을 보존하고 지도 API 응답을 연결한다.
2. `SPOT` 필터 라벨을 `쪽지`로 변경한다.
3. 공개 쪽지 필터와 친구 쪽지 필터의 조건을 명시적으로 분리하고 친구별 하위 필터는 제거한다.
4. 공개 쪽지 마커는 쪽지 사진과 카테고리 태그를 표시한다.
5. 친구 쪽지 마커는 프로필 사진이 들어간 `#FD4003` 핀으로 표시한다.
6. 장소 카드와 쪽지 카드를 분리하고 쪽지 전용 정보 구조를 적용한다.
7. 쪽지 목록은 모바일 드로어에서 가로 카드 탐색이 가능하도록 구성한다.
8. 실제 지도와 대체 지도, 선택 상태, 이미지 누락 상태를 검증한다.

## 승인된 변경 파일

- `.ai/tasks/AI-TASK-008.md`
- `.ai/logs/2026-06-22-AI-TASK-008.md`
- `src/shared/types/domain.ts`
- `src/features/map/mapApi.ts`
- `src/features/map/lib/mapPoints.ts`
- `src/features/map/components/MapFilterChips.tsx`
- `src/features/map/hooks/useKakaoMap.ts`
- `src/features/map/components/FallbackMapLayer.tsx`
- `src/features/map/components/MapListCard.tsx`
- `src/features/map/components/MapVisibleDrawer.tsx`
- `src/pages/MapPage.tsx`
- `src/shared/styles/global.css`

## 위험 및 대응

- 공개/친구 중복: 공개 필터는 공개 범위만, 친구 필터는 친구 관계만 검사한다.
- 필터별 마커: 활성 필터를 지도 마커 렌더러에 전달해 친구의 공개 쪽지도 현재 필터 문맥에 맞게 표시한다.
- 이미지 키 해석 실패: 쪽지 이미지가 없거나 로드되지 않으면 프로필 또는 문자 UI를 사용한다.
- API 필터 차이: 서버 필터 결과에 더해 클라이언트에서 공개 범위와 친구 관계를 재검증한다.
- 마커 HTML 안전성: API 문자열은 HTML 이스케이프 후 CustomOverlay에 삽입한다.
- 작은 드로어 높이: 쪽지 카드는 가로 스크롤로 제공하고 하단 안전 여백을 유지한다.

## 검증

- `npm run lint`
- `npm run build`
- 공개 쪽지 필터에 친구 전용/비공개 쪽지가 나타나지 않는지 확인
- 친구 필터에 친구 관계가 아닌 쪽지가 나타나지 않는지 확인
- 공개/친구 마커 시각 구분 확인
- 쪽지 이미지·이미지 없음·작성 시각 표시 확인
- 장소 카드 회귀 확인
