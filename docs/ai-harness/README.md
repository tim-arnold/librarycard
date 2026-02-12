# AI Agent Harness

Context persistence infrastructure for AI-assisted development, based on [Anthropic's harness architecture for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).

## Purpose

AI agents lose context between sessions. This directory provides:

1. **Progress tracking** - What's been done, what's in progress, what's blocked
2. **Feature checklists** - Comprehensive task lists to prevent premature completion
3. **Session continuity** - Quick ramp-up for new sessions

## Files

| File | Purpose |
|------|---------|
| `progress.md` | Current project state, completed work, session log |
| `feature-checklist.md` | Comprehensive feature tracking by workstream |

## Usage

### Starting a Session

1. Read `progress.md` to understand current state
2. Check git log: `git log --oneline -10`
3. Review `feature-checklist.md` for priorities
4. Verify build works: `npm run build && npm run lint`

### During a Session

- Work on **one feature at a time**
- Update checklist as items complete
- Commit frequently with descriptive messages
- Follow branch workflow in CLAUDE.md (never commit to main)

### Ending a Session

1. Update `progress.md` with:
   - Work completed this session
   - Any blockers or issues discovered
   - Next recommended actions
2. Update `feature-checklist.md` if items completed
3. Commit all changes

## Key Principles

From Anthropic's research:

1. **Explicit tracking prevents premature victory** - Don't declare "done" until checklist confirms it
2. **Git as memory** - Structured commits bridge context windows
3. **One feature per session** - Focus beats ambition
4. **Testing is non-negotiable** - `npm run build && npm run lint` after every change

## Implementation Phases

### Phase 1: Core Harness (Current)

Lightweight harness for session continuity:

- [x] **progress.md** - Current state, completed work, session log
- [x] **feature-checklist.md** - Track active workstreams and planned features
- [x] **CLAUDE.md integration** - Session startup/closeout protocol

### Phase 2: Agent Teams (Future)

If using Claude Code's experimental multi-agent teams feature:

- [ ] Multi-agent coordination protocols
- [ ] Task queue for parallel workstreams
- [ ] Conflict resolution for shared files
- [ ] Shared context store across agents

This phase is speculative and only relevant if agent teams become practical.

## Verification Commands

```bash
npm run build          # Build verification
npm run lint           # Lint check
cd testing && node screenshot.js  # UI screenshot testing (requires env vars)
```

## Related

- [CLAUDE.md](../../CLAUDE.md) - Project instructions and session protocol
- [Architecture Guide](../development/architecture.md) - System architecture
- [Anthropic Research](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) - Source architecture
