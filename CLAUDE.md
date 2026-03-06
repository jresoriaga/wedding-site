# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

This is the **SparkSoftDevs organizational `.github-private` repository** — it defines GitHub Copilot custom agents and skills that are automatically available to all org members in VS Code 1.107+. There is no application code, build system, or test suite here. The deliverables are markdown files that configure Copilot's agent mode behavior.

## Folder Conventions

- **`in/`** — User instructions and input documents (requirements, specs, reference material). Consult this folder first when clarification is needed.
- **`out/`** — Temporary artifacts (analysis results, plans, drafts, diffs). All working output goes here.
- **`agents/`** — Copilot agent definitions (`*.agent.md`). These are the `@agent-name` agents available in VS Code chat.
- **`.github/skills/`** — Copilot skill definitions, one `SKILL.md` per skill folder.
- **`.github/copilot-instructions.md`** — Org-wide Copilot instructions (skill activation matrix, quick-reference rules).
- Both `in/` and `out/` are gitignored — local working directories only.

## Architecture

### Agent System

14 agents in `agents/`, each following the same frontmatter structure:

```yaml
---
name: Display Name
description: One-line purpose
tools: ['search', 'read', 'edit', 'execute', ...]
infer: true
handoffs:
  - label: Button Text
    agent: target-agent-name
    prompt: Context passed to next agent
    send: true
---
```

The body below frontmatter is the agent's system prompt (markdown).

**Agent roster**: `feature-workflow` (orchestrator — triages by security priority AND scope, decomposes compound requests), `prompt`, `planner`, `architect`, `implementer`, `qa`, `security`, `reviewer`, `verifier`, `debugger`, `docs`, `e2e`, `testability`, `merger`.

**Handoff chain**: Agents pass conversation history via handoff buttons. The canonical flow is:
```
@prompt → @planner → @implementer → @qa → @security → @reviewer → @verifier → @docs → @e2e
```
Variations exist by security priority:
- **Critical**: `@prompt → @security → @planner → @implementer → @qa → @security → @reviewer → @verifier → @docs → @e2e` (optional @architect before @security if significant design decisions needed)
- **Elevated**: `@prompt → @planner → @implementer → @qa → @security → @reviewer → @verifier → @docs → @e2e`
- **Standard**: `@prompt → @planner → @implementer → @qa → @reviewer → @verifier → @docs → @e2e`
- **Trivial**: `Manual edit → @reviewer`

Lateral agents (not in the main chain): `@debugger` (escape hatch for failures), `@testability` (additive test hook refactoring), `@merger` (conflict resolution).

### Skill System

Skills live in `.github/skills/<skill-name>/SKILL.md`. They provide domain knowledge that agents reference via URL links in their "Required Skills" sections.

Skills are **not executable code** — they are instruction sets that Copilot loads when an agent references them.

### Cross-Cutting Concerns

- **OWASP Top 10:2025** alignment is woven through every agent, not isolated to `@security`.
- **AC ID traceability**: `@prompt` assigns a feature SLUG and namespaced IDs (AC-{SLUG}-F#, AC-{SLUG}-S#, AC-{SLUG}-P#, AC-{SLUG}-E#) that flow through planning → implementation → verification.
- **Evidence-first claims**: All agents must cite `file:line` references, not make vague assertions.
- **Severity categorization**: CRITICAL/HIGH/MEDIUM/LOW with CRITICAL/HIGH blocking merge.

## Key Conventions When Editing

- Agent files must have valid YAML frontmatter with `name`, `description`, `tools`, and `handoffs`.
- Handoff `agent` values must match the filename stem of another agent (e.g., `agent: planner` → `planner.agent.md`).
- Skill references in agents use relative paths from `agents/` to `../.github/skills/<name>/SKILL.md`. Copilot resolves these from the org repo when agents are activated.
- The `copilot-instructions.md` skill activation matrix must stay in sync with the skills that actually exist in `.github/skills/`.
- Agent descriptions should be concise — VS Code shows them in the agent picker dropdown.
