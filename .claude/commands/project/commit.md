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
- Create a descriptive commit message that follows project conventions (no AI attribution)
- Commit the changes with `git commit -m "commit message"`
- Run `git status` to confirm commit succeeded

## Pull Request Creation
Create a pull request following LibraryCard standards:
- Push the current branch to remote with `git push -u origin [branch-name]` 
- Use `gh pr create` to create a pull request with:
  - Clear title describing the work completed
  - Body with "## Summary" section (1-3 bullet points)
  - Body with "## Test plan" section with testing checklist
  - Include the GitHub issue link if working on a specific issue
- Return the PR URL for easy access

## Quality Checks
Before finalizing, ensure code quality:
- Run `npm run build` to verify the build succeeds
- Run `npm run lint` to check for linting issues
- Address any build or lint failures before creating the PR

## Branch Management
Follow LibraryCard branch conventions:
- Ensure you're not on main branch (never commit directly to main)
- Use proper branch naming: `feature/gh{issue-number}-{description}` or `feature/{description}`
- Create PR targeting main branch for review