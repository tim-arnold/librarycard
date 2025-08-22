---
description: Complete project commit workflow - update docs, commit, and create PR
---

# LibraryCard Project Commit Workflow

Complete the standard LibraryCard development workflow: update documentation, commit changes, and create a pull request.

## Documentation Updates
First, update all relevant project documentation:
- Update docs/reference/CHANGELOG.md with the completed work
- Update any relevant documentation in docs/ that relates to this work
- Update docs/reference/TODO.md to mark completed items and add any new todos discovered

## Git Workflow  
Follow the LibraryCard branch-based development workflow:
- Run `git status` to see all changes
- Run `git add .` to stage all changes
- Create a descriptive commit message that follows project conventions (start with Jira ticket: "LCWEB-123 feat: description")
- Commit the changes with `git commit -m "LCWEB-123 commit message"`
- Run `git status` to confirm commit succeeded

## Pull Request Creation
Create a pull request following LibraryCard standards:
- Push the current branch to remote with `git push -u origin [branch-name]` 
- Use `gh pr create` to create a pull request with:
  - Clear title describing the work completed (include Jira ticket if applicable: "LCWEB-123 feat: description")
  - Body with "## Summary" section (1-3 bullet points)
  - Body with "## Test plan" section with testing checklist
  - Include the Jira ticket reference if working on a specific ticket
- Return the PR URL for easy access

## Jira Issue Updates
If working on a specific Jira ticket, update it with progress:
- Use `jira issue edit LCWEB-123 --no-input` with progress comments
- Include summary of changes implemented, technical details, and PR link
- Use `jira issue transition LCWEB-123 Done` when work is completed
- Provide clear documentation for future reference with branch name and commit details

## Branch Management
Follow LibraryCard branch conventions:
- Ensure you're not on main branch (never commit directly to main)
- Use proper branch naming: `LCWEB-{issue-number}-{description}` for Jira tickets or `feature/{description}` for non-issue work
- Create PR targeting main branch for review