# AGENTS.md

## Project Context

This is a frontend project for a local map-based recommendation service.

Main features:

- Local place discovery
- Map-based exploration
- Place cards
- BottomSheet UI
- Saved places
- Personalized local briefing

This project uses Oh My Codex for AI-assisted development.

## AI-assisted Development Rules

### Task size policy

Small task:

- Direct implementation is allowed.
- Examples: text changes, style fixes, simple component adjustments.

Medium task:

- First provide a short plan.
- Do not edit files until the user approves.

Large task:

- Use a task document under `.ai/tasks/`.
- Follow: research → plan → approval → implementation → review → log.

### Approval gate

For medium or large tasks, do not create, edit, delete, rename, or refactor files until the user writes:

APPROVED: AI-TASK-XXX

### Scope control

Only modify files listed in the approved plan.
If another file needs changes, stop and ask for approval.

### Role separation

For large tasks, use sub-agent roles:

- Researcher: inspect existing structure only
- Planner: create implementation plan and risk analysis only
- Implementer: edit files only after approval
- Reviewer: review diff only, never edit files

### Logging

For large tasks, record:

- prompt summary
- files inspected
- files changed
- commands run
- build/lint result
- reviewer result

Logs are stored under `.ai/logs/`.

### Verification

After implementation, run at least:

- npm run build

When relevant, also run:

- npm run lint
