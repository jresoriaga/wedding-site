---
name: Version Gate
description: Declares the current version of the SparkSoft agent and skill system
---

# SparkSoft Agent System Version

**Current Version: 1.0.0**
**Released: 2026-03-01**

This skill exists solely as a synchronization checkpoint. All org-level agents read this file before starting work. If an agent directed you here, your `.github` directory is correctly synchronized.

## For Developers

If an agent told you the version check failed, your project's `.github` directory is stale. Update it from the latest `SparkSoftDevs/.github-private` repository.

## For Maintainers

When releasing a breaking change to agents or skills:
1. Bump `Current Version` above (semver)
2. Update `Expected minimum version` in all 14 agent files under `agents/`
3. Commit both changes together
