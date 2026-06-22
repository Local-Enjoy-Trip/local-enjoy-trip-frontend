# AI-TASK-001 — AI 코스 추천과 코스 상세 확장

## Prompt summary

- AI 추천을 서울 동네, 일행, 여행 취향, 일정 밀도의 단계형 질문으로 구성한다.
- 생성 로딩 뒤 기존 코스 상세 표현을 활용한 추천 결과를 보여준다.
- 결과에서 내 코스에 담기, 같은 조건으로 새 추천, 처음부터 다시하기를 제공한다.
- 저장한 추천은 내 코스 목록과 상세 화면에서 확인한다.
- 상세 화면에 친구 공동 일정, AI 동선 정리, 공유 메뉴, 확장 지도를 추가한다.

## Approved scope

- `src/pages/CoursePage.tsx`
- `src/pages/CreateCoursePage.tsx`
- `src/pages/CourseDetailPage.tsx`
- `src/features/course/courseStorage.ts`
- `src/shared/types/domain.ts`
- `src/shared/data/mockData.ts`
- `.ai/tasks/AI-TASK-001.md`
- `.ai/logs/AI-TASK-001.md`
- `.omx/state/AI-TASK-001/ralph-progress.json`

## Implementation plan

1. 브라우저 로컬 저장소 기반 코스 모델과 샘플 추천 생성기를 만든다.
2. AI 추천 화면을 4단계 질문, 로딩, 추천 결과로 재구성한다.
3. 추천 결과 저장과 코스 목록/상세 조회를 연결한다.
4. 상세 화면에 친구 선택, 공유 옵션, AI 동선 정리, 지도 확장과 장소 캐러셀을 추가한다.
5. 모바일 뷰포트에서 참고 이미지와 비교하고 visual verdict 90점 이상을 목표로 반복한다.
6. build, lint, 주요 사용자 흐름을 검증하고 로그를 남긴다.

## Acceptance criteria

- AI 추천 질문은 이전/다음 이동과 선택 상태를 보존한다.
- 필수 선택 전에는 다음 버튼이 비활성화된다.
- 로딩 후 추천 결과가 표시된다.
- 새 추천은 조건을 유지하고 장소 조합을 바꾼다.
- 처음부터 다시하기는 모든 선택을 초기화한다.
- 내 코스에 담은 결과는 코스 목록과 상세에서 다시 열린다.
- 친구 선택 결과가 상세 화면에 표시되고 저장된다.
- 공유 메뉴에서 이미지 저장과 보기 전용 링크 복사를 실행할 수 있다.
- AI 동선 정리 결과를 사용자가 확인하고 적용할 수 있다.
- 확장 지도에서 장소 카드를 넘기거나 선택하면 활성 장소가 바뀐다.
- `npm run build`와 `npm run lint`가 통과한다.

## Risks

- 백엔드의 코스 생성·친구·공유 API가 없어 로컬 저장 상태로 구현한다.
- 지도 SDK가 없는 환경에서는 기존 대체 지도 레이어를 사용한다.
- 보기 전용 링크는 현재 브라우저의 로컬 코스 데이터에 한정된 목업이다.
