# AI-assisted Development Workflow

## 개요

이 프로젝트는 Oh My Codex 기반 AI-assisted development workflow를 적용한 프론트엔드 프로젝트입니다.

AI가 바로 코드를 수정하지 않고, 작업 규모에 따라 기존 구조 분석, 구현 계획 수립, 사용자 승인, 구현, 리뷰, 로그 기록 단계를 거치도록 구성했습니다.

## 핵심 원칙

### 1. Plan-first workflow

중간 이상의 작업에서는 AI가 바로 구현하지 않고, 먼저 기존 코드 구조를 분석한 뒤 작업 계획과 리스크를 정리합니다.

### 2. Human approval gate

AI는 사용자가 아래 승인 문구를 입력하기 전까지 파일을 수정할 수 없습니다.

APPROVED: AI-TASK-XXX

### 3. Sub-agent role separation

큰 작업에서는 Oh My Codex의 sub-agent workflow를 활용해 역할을 분리합니다.

- Researcher: 기존 코드 구조 조사
- Planner: 구현 계획 및 리스크 정리
- Implementer: 승인 이후 구현
- Reviewer: 구현 diff 검토, 직접 수정 금지

### 4. Prompt and tool usage logging

큰 작업에서는 다음 내용을 로그로 기록합니다.

- prompt summary
- files inspected
- files changed
- commands run
- verification result
- reviewer result

## Task Lifecycle

작업은 아래 흐름으로 이동합니다.

todo → approved → executed

## 현재 적용 작업

- AI-TASK-001: 지도 마커와 BottomSheet 선택 상태 동기화

## 기대 효과

- AI 코드 생성 전 변경 범위와 리스크를 확인할 수 있습니다.
- 승인된 작업 범위 안에서만 구현하게 하여 예기치 않은 파일 변경을 줄입니다.
- Researcher, Planner, Reviewer 역할을 분리해 구현과 검증 과정을 독립적으로 운영합니다.
- prompt, 수정 파일, 실행 명령, 리뷰 결과를 기록해 문제 발생 시 원인을 추적할 수 있습니다.