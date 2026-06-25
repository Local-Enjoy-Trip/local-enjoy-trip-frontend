# AI-TASK-009 — 쪽지 작성 지도로 위치 먼저 선택 흐름 및 UI 개선

## 요청 요약

쪽지 작성 시 기존에 바로 작성 페이지가 열리던 흐름에서, 먼저 지도를 띄워 위치를 선택하도록 변경하고, 선택이 완료되면 사용자가 전달한 이미지 레이아웃에 맞춰 쪽지 작성 페이지를 새롭게 구성합니다.

## 조사 기준

- 쪽지 작성 진입 경로: `src/shared/components/AppShell.tsx`에서 `to: "/note/location"` 및 `state: { isFirstSelect: true }` 전달
- 첫 진입 백 버튼 처리: `NoteLocationPage.tsx`에서 `state?.isFirstSelect`를 검사하여 뒤로가기(`navigate(-1)`) 수행
- 쪽지 작성 전 위치 보장: `CreateNotePage.tsx` 진입 시 위치(`noteLocation`) 정보가 없고 편집 상태가 아닌 경우 `/note/location`으로 리다이렉트
- 쪽지 작성 UI 개편: 사용자 이미지 디자인 반영 (닉네임 헤더, 위치 카드 + 우측 버튼, 사진 추가 박스, 텍스트에어리어, 태그 칩 CRUD 및 공개범위 드롭다운)

## 구현 계획

1. `src/shared/components/AppShell.tsx`에서 쪽지 남기기 경로를 `/note/location`으로 변경하고 `isFirstSelect: true` 상태 전달.
2. `src/pages/NoteLocationPage.tsx`에서 `isFirstSelect` 플래그가 참인 경우 백 버튼 클릭 시 뒤로가도록 구현.
3. `src/pages/CreateNotePage.tsx`에서 위치 정보가 없으면 리다이렉션 처리하도록 `useEffect` 추가.
4. `src/pages/CreateNotePage.tsx`에 `useAuthUser`를 통해 로그인한 사용자의 닉네임을 헤더에 연동.
5. 사용자 제공 이미지에 맞춰 `CreateNotePage.tsx` UI를 대대적으로 스타일링 및 재배치 (위치 카드, 사진 박스, 텍스트 영역, 태그 CRUD 칩, 공개범위 드롭다운).
6. 새로 태그를 추가하는 `+` 칩 컴포넌트와 인터랙션 구현.
7. TypeScript 빌드 에러 및 ESLint 오류 방지를 위해 코드 수정 검증.

## 승인된 변경 파일

- `.ai/tasks/AI-TASK-009.md`
- `.ai/logs/2026-06-25-AI-TASK-009.md` (완료 후 작성 예정)
- `src/shared/components/AppShell.tsx`
- `src/pages/NoteLocationPage.tsx`
- `src/pages/CreateNotePage.tsx`

## 위험 및 대응

- **리다이렉트 무한 루프:** 위치 정보를 전달받았을 때 리다이렉트 조건이 완벽히 비활성화되는지 검증합니다.
- **히스토리 유실:** 직접 url로 `/note/location`에 직접 접근한 경우 history가 없을 때 `/`로 내비게이트 하도록 안전망을 둡니다.
- **태그 가로 스크롤/줄바꿈:** 태그가 너무 많을 경우 레이아웃이 깨지지 않도록 `flex-wrap`을 주어 모바일에 최적화합니다.

## 검증

- `npm run lint`
- `npm run build`
- 네비게이션 '쪽지 남기기' 선택 시 지도 먼저 진입 확인
- 지도 드로어 선택 완료 후 변경된 리뉴얼 UI 확인
- 닉네임, 태그 수정/추가, 사진 추가, 등록 완료 등 모든 인터랙션 회귀 테스트
