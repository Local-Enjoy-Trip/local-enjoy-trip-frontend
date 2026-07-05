# AI-TASK-016

## 목표

곳곳 서비스의 핵심 사용자 흐름이 리팩토링 이후에도 깨지지 않는지 확인하기 위해 Playwright 기반 E2E smoke test를 추가한다.

## 하지 않을 것

- 실제 백엔드 API 연동 테스트는 하지 않는다.
- AI 실제 토큰 호출은 하지 않는다.
- 디자인 수정은 하지 않는다.
- 테스트 안정성을 위해 필요한 최소한의 test id 추가 외 UI 구조는 바꾸지 않는다.
- 전체 테스트 커버리지 확보를 목표로 하지 않는다. 핵심 smoke test만 작성한다.

## 조사한 파일

- `package.json`
- `vite.config.ts`
- `src/app/router.tsx`
- `src/features/auth/RequireAuth.tsx`
- `src/features/auth/authStore.ts`
- `src/shared/components/AppShell.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/CoursePage.tsx`
- `src/pages/CreateCoursePage.tsx`
- `src/pages/CreateNotePage.tsx`
- `src/pages/MyPage.tsx`
- `src/features/course/courseApi.ts`
- `src/features/home/homeApi.ts`
- `src/features/notes/noteApi.ts`
- `src/features/friends/friendApi.ts`

## 수정 예상 파일

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `e2e/core-smoke.spec.ts`
- `.ai/tasks/AI-TASK-016.md`
- `.ai/logs/2026-07-05-AI-TASK-016.md`

## 구현 계획

1. Playwright 의존성과 `test:e2e` 스크립트를 추가한다.
2. Vite build/preview 서버를 사용하는 `playwright.config.ts`를 추가한다.
3. 인증 세션은 `sessionStorage`에 주입하고 `/api/*` 요청은 Playwright route mock으로 대체한다.
4. 홈 진입, AI 코스 생성 1단계부터 4단계, AI 추천 결과 확인, 쪽지 내용/태그 입력, 마이페이지 내 쪽지 메뉴 확인을 하나의 smoke test로 작성한다.
5. UI 소스는 접근성 selector로 충분하면 수정하지 않는다.
6. `npm run build`, `npm run lint`, `npm run test:e2e`를 실행한다.

## 구현 리스크

- Playwright 브라우저 바이너리가 로컬에 없으면 별도 설치가 필요하다.
- API mock 응답 shape가 실제 백엔드와 달라지면 smoke test의 신뢰도가 낮아질 수 있다.
- 홈 화면은 위치 권한과 Kakao 지도 키 유무에 따라 초기 비동기 상태가 달라질 수 있다.
- 접근성 이름 기반 selector는 UX 문구 변경에 영향을 받는다.

## 검증 방법

- `npm run build`
- `npm run lint`
- `npm run test:e2e`
- 실패 시 Playwright screenshot/trace 확인

## 승인 문구

`APPROVED: AI-TASK-016`

## 변경한 파일

- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `e2e/core-smoke.spec.ts`
- `.ai/tasks/AI-TASK-016.md`
- `.ai/logs/2026-07-05-AI-TASK-016.md`

## 실행한 명령

- `npm install -D @playwright/test`
- `npm run build`
- `npm run lint`
- `npm run test:e2e`
- `npx playwright install chromium`
- `npm run test:e2e`

## 검증 결과

- `npm run build`: 통과
- `npm run lint`: 통과. 기존 fast-refresh/hook 경고 5개가 남아 있으나 에러는 없음.
- `npm run test:e2e`: 최초 실행은 sandbox의 preview 서버 listen 제한으로 실패.
- `npm run test:e2e` 권한 승격 재실행: Chromium 바이너리 미설치로 실패.
- `npx playwright install chromium`: Chromium 설치 완료.
- `npm run test:e2e` 재실행: 1개 smoke test 통과.

## 남은 리스크

- API mock 응답은 smoke test에 필요한 최소 shape만 포함하므로 실제 백엔드 계약 전체를 보장하지 않는다.
- Playwright Chromium 바이너리는 로컬 캐시에 설치되어야 한다.
- 접근성 이름 기반 selector는 주요 문구가 바뀌면 테스트도 함께 갱신해야 한다.
