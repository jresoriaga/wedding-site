---
name: brainstorming
description: Use when creating or developing features, before writing code or implementation plans - refines rough ideas into fully-formed designs through collaborative questioning, alternative exploration, and incremental validation.
---

# Brainstorming Laravel Ideas Into Designs

## Overview

Turn Laravel feature ideas into fully formed designs through natural collaborative dialogue. Start by understanding the project context, then ask questions one at a time to refine the idea.

## The Process

### 1. Understanding the Idea
Check current project state (routes, models, migrations). Ask questions one at a time, prefer multiple choice. Focus on: purpose, Laravel patterns, constraints, success criteria.

### 2. Exploring Approaches
Propose 2-3 different Laravel approaches with trade-offs. Lead with your recommendation and explain why.

### 3. Presenting the Design
Present in sections of 200-300 words. Ask after each section if it looks right. Cover: database schema, models & relationships, routes & controllers, services/actions, queues/events, API resources, validation, testing.

## Key Principles

- **One question at a time** — Don't overwhelm
- **Multiple choice preferred** — Easier to answer
- **YAGNI ruthlessly** — Remove unnecessary features
- **Laravel conventions first** — Built-in before custom
- **Explore alternatives** — Always 2-3 approaches
- **Incremental validation** — Validate each section
- **Be flexible** — Go back and clarify

## After the Design

Write validated design to `docs/designs/YYYY-MM-DD-<feature>-design.md`. Create implementation checklist. Consider TDD approach.

## References

- Laravel-specific design sections: `references/design-sections.md`
- Example brainstorming session: `references/example-session.md`
- Architecture/DB/Performance/Testing/Security considerations: `references/laravel-considerations.md`
