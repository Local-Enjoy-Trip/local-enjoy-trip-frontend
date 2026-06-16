# AI-TASK-001: 지도 마커와 BottomSheet 선택 상태 동기화

## 상태

approved

## 목표

지도 마커를 클릭했을 때 해당 장소가 선택되고, BottomSheet 또는 장소 카드 UI에도 동일한 선택 상태가 반영되도록 한다.

## 하지 않을 것

- 실제 API 연동은 하지 않는다.
- DB 저장 기능은 추가하지 않는다.
- 추천 알고리즘은 변경하지 않는다.
- 디자인 시스템 전체를 리팩토링하지 않는다.

## 작업 흐름

Researcher → Planner → Approval → Implementer → Reviewer → Log

## 사용 역할

- Researcher
- Planner
- Implementer
- Reviewer

## 조사 결과

1. **지도 화면 파일**

- 메인 화면은 `src/pages/MapPage.tsx`입니다.
- 여기서 `useQuery(["map-pins"], getMapPins)`로 마커 원본 데이터를 받고, `useMapStore()`에서 `selectedPinId`, `selectPin`, `filter`, `selectedFriend`를 꺼내 씁니다.
- 지도 렌더링은 `useKakaoMap(filteredPoints, selectMapPin)`에 맡기고, BottomSheet 역할은 `MapVisibleDrawer`가 담당합니다.

2. **마커 데이터가 오는 위치**

- API 진입점: `src/shared/api/mockApi.ts`의 `getMapPins()`
- 실제 데이터 원본: `src/shared/data/mockData.ts`의 `places`, `notes`
- 지도용 변환: `src/features/map/lib/mapPoints.ts`의 `toMapPoints()`
- 필터링: 같은 파일의 `filterMapPoints()`
- 클러스터링: 같은 파일의 `clusterPoints()`
- 실제 지도 마커는 `MapPage`에서 만든 `filteredPoints`가 `src/features/map/hooks/useKakaoMap.ts`로 들어가 overlay로 그려집니다.

3. **BottomSheet가 받는 props**

- BottomSheet 역할 컴포넌트는 `src/features/map/components/MapVisibleDrawer.tsx`입니다.
- 현재 `MapPage`가 넘기는 props:
  - `drawerSnap`
  - `onSelectPoint`
  - `onSnapChange`
  - `selectedPoint`
  - `visiblePoints`
- 내부 동작:
  - `selectedPoint`가 있으면 `featured` 카드 1개만 표시
  - 없으면 `visiblePoints` 목록 표시
- 카드 컴포넌트는 `src/features/map/components/MapListCard.tsx`이며, 현재는 `featured` 외 선택 강조 prop이 없습니다.

4. **선택된 장소 상태가 이미 있는지**

- 있습니다. 전역 상태는 `src/features/map/mapStore.ts`의 `selectedPinId`입니다.
- `MapPage`에서는 `selectedPinId` 기준으로 `selectedPoint`를 `allPoints.find(...)`로 파생합니다.
- BottomSheet 열림/높이 상태는 별도 `drawerSnap` 상태이며, 선택 상태가 아니라 UI 스냅 상태입니다.
- 마커 클릭 경로:
  - `useKakaoMap()` overlay click → `onSelectPoint(point.id)` → `selectMapPin()` → `selectPin(pinId)` + `setDrawerSnap("default")`
- 카드 클릭 경로:
  - `MapVisibleDrawer`의 `onSelect(point)` → `selectVisiblePoint()` → `selectPin(point.id)` + `setDrawerSnap("default")` + `kakao.moveTo(point.coordinates)`

5. **새 상태가 필요한지**

- 새 전역 상태는 일단 필요 없어 보입니다.
- 이미 `selectedPinId`가 단일 소스 오브 트루스 역할을 할 수 있습니다.
- 다만 현재는 선택 상태가 마커 시각효과까지 전달되지 않습니다.
  - `useKakaoMap()`의 overlay 생성 로직은 선택된 포인트를 인자로 받지 않습니다.
  - `FallbackMapLayer`도 선택 하이라이트 prop이 없습니다.
  - `MapListCard`도 선택 강조 prop이 없습니다.
- 따라서 상태 추가보다는 기존 `selectedPinId`를 마커/카드 렌더링까지 전달하는 prop 확장이 우선입니다.

6. **수정 후보 파일**

- `src/pages/MapPage.tsx`
  - 선택 상태의 단일 소스 정리, marker click과 sheet click 행동 통일, `selectedPinId` 기반 파생값 전달 지점
- `src/features/map/mapStore.ts`
  - 현재 `selectedPinId`가 충분한지 재검토할 기준점
- `src/features/map/hooks/useKakaoMap.ts`
  - 선택 마커 강조, 클릭 시 map recenter/zoom 동기화
- `src/features/map/components/MapVisibleDrawer.tsx`
  - 선택 카드 표시/상태 전파
- `src/features/map/components/MapListCard.tsx`
  - 선택된 카드 하이라이트 필요 시
- `src/features/map/components/FallbackMapLayer.tsx`
  - Kakao 미사용/에러 경로에서도 동일한 선택 동기화 필요 시
- `src/features/map/lib/mapPoints.ts`
  - 선택 대상이 필터/검색에서 빠질 때의 처리 기준 검토

7. **구현 리스크**

- 선택과 시각 상태가 분리됨
  - 지금은 `selectedPinId`만 바뀌고, 지도 마커 스타일은 바뀌지 않습니다.
- 마커 클릭과 BottomSheet 카드 클릭의 동작이 다름
  - 카드 클릭은 `kakao.moveTo()`로 지도 이동까지 하지만, 마커 클릭은 현재 이동이 없습니다.
- 필터/검색으로 선택 대상이 사라질 수 있음
  - `selectedPoint`는 `allPoints`에서 찾고 있어서, `filteredPoints`에서 사라져도 선택 상태가 유지됩니다.
  - 이 경우 BottomSheet는 선택된 장소를 보여주지만 지도에는 마커가 안 보일 수 있습니다.
- 클러스터 렌더링 로직과 선택 강조가 충돌할 수 있음
  - `useKakaoMap()`는 `points`/`level` 변경 때 overlay를 통째로 다시 만듭니다. 선택 스타일을 넣을 때 재생성 타이밍을 주의해야 합니다.
- Fallback 경로와 Kakao 경로의 UI 일치성
  - `FallbackMapLayer`와 Kakao overlay에 같은 선택 규칙을 따로 넣지 않으면, 브라우저 상태에 따라 선택 표현이 달라질 수 있습니다.

## 구현 계획

## 1. 목표

- 지도 마커 선택 상태와 BottomSheet 카드 선택 상태를 하나의 기준으로 동기화한다.
- 기존 `selectedPinId`를 단일 소스로 사용해, 마커 클릭과 카드 클릭이 동일한 선택 결과를 만들도록 정리한다.
- 선택된 장소가 지도와 리스트에서 일관되게 강조되도록 반영한다.
- 승인 전에는 구현을 시작하지 않는다.

## 2. 하지 않을 것

- 새로운 전역 상태를 추가하지 않는다.
- API 응답 구조나 mock 데이터 자체는 바꾸지 않는다.
- BottomSheet 스냅 정책을 전면 개편하지 않는다.
- 클러스터링 로직이나 필터 정책을 기능적으로 재설계하지 않는다.
- 승인 전 코드 수정, 파일 생성/삭제, 포맷팅, 스테이징을 하지 않는다.

## 3. 변경 예상 파일

- `src/pages/MapPage.tsx`
- `src/features/map/mapStore.ts`
- `src/features/map/hooks/useKakaoMap.ts`
- `src/features/map/components/MapVisibleDrawer.tsx`
- `src/features/map/components/MapListCard.tsx`
- `src/features/map/components/FallbackMapLayer.tsx`
- 필요 시 `src/features/map/lib/mapPoints.ts` 확인

## 4. selectedPlace 상태를 어디에 둘지

- `selectedPlace` 전용 새 상태를 만들지 않고, 기존 `selectedPinId`를 선택 상태의 단일 소스로 유지한다.
- `MapPage`에서 `allPoints` 또는 현재 렌더링 대상 목록 기준으로 `selectedPoint`를 파생한다.
- BottomSheet, 지도 마커, fallback 마커 UI는 모두 `selectedPinId` 또는 그 파생값만 참조하도록 맞춘다.
- 필터 변경으로 선택 대상이 목록에서 사라질 때의 처리 기준도 여기서 명확히 정한다.
- 기본안: 선택된 ID가 현재 `visiblePoints`에 없으면 선택 강조만 해제하고, 상태 초기화 여부는 구현 전 검토한다.

## 5. 마커 클릭 흐름

- 카카오 지도 마커/오버레이 클릭 시 `onSelectPoint(point.id)`로 진입한다.
- `MapPage`의 선택 핸들러에서 `selectPin(point.id)`를 호출하고 `drawerSnap("default")`를 유지한다.
- 선택된 마커 스타일이 즉시 갱신되도록 `useKakaoMap` 내부 렌더링이 `selectedPinId` 변경에 반응하는지 점검한다.
- 클러스터/오버레이 재생성 시 선택 스타일이 유실되지 않도록 의존성 및 재렌더 조건을 정리한다.
- 동일 동작을 `FallbackMapLayer`에도 맞춰 카카오 지도 미사용 환경과 일관성을 맞춘다.

## 6. BottomSheet 반영 방식

- `MapVisibleDrawer`에 현재 선택된 ID 또는 선택 여부를 전달해 리스트와 featured 카드가 같은 기준으로 강조되게 한다.
- `selectedPoint`가 있으면 featured 카드 우선 표시, 없으면 `visiblePoints` 리스트 표시라는 현재 구조를 유지한다.
- `MapListCard`에 `selected` 같은 표현용 prop을 추가하는 방향으로 계획한다.
- 카드 클릭 시에도 `selectPin(point.id)`, `setDrawerSnap("default")`, `kakao.moveTo(...)` 흐름을 유지해 마커 클릭과 결과를 통일한다.
- 선택된 장소가 리스트에 있을 경우 해당 카드 강조, featured 상태일 경우 featured 카드도 동일 기준으로 강조한다.

## 7. 리스크

- 선택 상태와 `drawerSnap`이 별도 상태라 UI가 어긋날 수 있다.
- 필터 변경 후 선택된 ID가 현재 visible 목록에 없으면 강조/상세 표시가 어색해질 수 있다.
- `useKakaoMap`의 오버레이/클러스터 재생성 시 선택 스타일이 초기화될 수 있다.
- fallback 레이어와 Kakao 지도 레이어의 선택 표현이 달라질 수 있다.
- `selectedPoint` 파생 기준이 `allPoints`인지 `visiblePoints`인지에 따라 UX가 달라질 수 있다.

## 8. 검증 방법

- 마커 클릭 시:
  - 해당 마커가 선택 스타일로 바뀌는지 확인
  - BottomSheet가 `default` 스냅으로 열리거나 유지되는지 확인
  - featured 카드 또는 해당 카드 강조가 맞는지 확인
- 카드 클릭 시:
  - `selectedPinId`가 갱신되는지 확인
  - 지도 중심 이동과 마커 강조가 함께 반영되는지 확인
- 필터 변경 시:
  - 선택된 장소가 visible 목록에서 사라질 때 UI가 깨지지 않는지 확인
- Kakao 지도와 `FallbackMapLayer` 양쪽에서 동일한 선택 동작이 재현되는지 확인
- 구현 후 최소 `npm run build`, 필요 시 `npm run lint`로 검증한다.

## 9. 승인 문구

- 구현은 승인 전 시작하지 않는다.
- 승인 시 아래 문구를 그대로 사용:

`APPROVED: AI-TASK-001`

## 승인 상태

승인 완료.

승인 문구:

APPROVED: AI-TASK-001

## 수정 대상

src/pages/MapPage.tsx
src/features/map/hooks/useKakaoMap.ts
src/features/map/components/MapVisibleDrawer.tsx
src/features/map/components/MapListCard.tsx
src/features/map/components/FallbackMapLayer.tsx

## 확인만 할 파일

src/features/map/mapStore.ts
src/features/map/lib/mapPoints.ts

## 필터 변경 시 선택 정책

selectedPoint는 allPoints 기준으로 파생해 기존 선택 상세를 유지한다.
단, selectedPinId가 현재 visiblePoints에 포함되지 않으면 리스트와 마커 강조는 표시하지 않는다.
이 task에서는 필터 변경 시 selectedPinId를 자동 초기화하지 않는다.
자동 초기화 정책은 별도 UX 개선 task에서 다룬다.

## 선택 동작 기준

마커 클릭과 카드 클릭은 모두 selectPin(point.id)를 호출해 동일한 선택 상태를 만든다.
카드 클릭은 사용자가 리스트에서 장소를 선택하는 흐름이므로 기존처럼 kakao.moveTo(point.coordinates)를 유지한다.
마커 클릭은 이미 지도 위의 대상을 클릭한 것이므로 별도 지도 이동은 추가하지 않는다.
두 경로 모두 BottomSheet에는 동일한 selectedPoint가 반영되도록 한다.

## 실행 명령

- `npm run build`
- `npm run lint`

## 검증 결과

- `npm run build` 성공
- `npm run lint` 성공
- 정적 검토 결과:
  - `selectedPinId`를 기존 선택 상태로 유지하고 새 전역 상태를 추가하지 않음
  - `selectedPoint`는 `allPoints` 기준 파생을 유지함
  - `visiblePoints`에 포함된 선택 ID만 마커/카드 강조 대상으로 전달함
  - 카드 클릭은 기존 `kakao.moveTo(point.coordinates)` 유지
  - 마커 클릭에는 별도 지도 이동을 추가하지 않음

## 리뷰 결과

- 검토 결과 request changes 없음
- 승인 범위 밖 코드 파일 수정 없음
- 남은 리스크:
  - 실제 브라우저에서 Kakao 지도 API 키가 준비된 상태의 수동 클릭 검증은 별도 환경에서 확인 필요

## 최종 상태

executed
