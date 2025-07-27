---
description: Get Claude Code up to speed on LibraryCard project
---

# LibraryCard Project Prime Setup

Get up to speed on the LibraryCard project by examining git status, key documentation, configuration files, and project structure.

## Git and Project Analysis
First, check the current git status and recent activity:
- Run `git status` to see current working tree state
- Run `git log --oneline -10` to see recent commits
- Run `git ls-files | head -20` to see tracked files
- Run `ls -la` to see directory structure

## Read Key Documentation
Read these essential project files:
- README.md
- CLAUDE.md  
- docs/reference/TODO.md
- docs/reference/CHANGELOG.md
- docs/development/architecture.md
- docs/guides/getting-started.md

## Read Configuration Files
Examine the project configuration:
- package.json
- tsconfig.json
- next.config.js
- wrangler.toml
- netlify.toml

## Read Core Application Files
Review key application structure:
- src/app/layout.tsx
- src/app/page.tsx
- src/lib/types.ts
- workers/index.ts
- workers/types/index.ts

## Project Structure Overview
List the main component directories:
- List contents of src/components/
- List contents of src/lib/
- List contents of workers/

## Recent Changes Context
Check recent development activity:
- Run `git diff HEAD~5 --name-only` to see recently changed files
- Run `git show --name-only HEAD` to see latest commit changes