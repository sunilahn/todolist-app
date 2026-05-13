# Repository Guidelines

## Project Structure & Module Organization

This repository is in the planning/specification stage. Authoritative documents live in `docs/`:

- `docs/1-domain-definition.md`: domain model, business rules, bounded contexts.
- `docs/2-prd.md`: product scope, non-functional requirements, planned stack, API conventions.

`opencode.json` configures MCP tooling for agent-assisted work. Hidden directories such as `.codex/`, `.claude/`, `.gemini/`, and `.opencode/` contain tool-specific configuration, not application source.

Application code, tests, and assets have not been scaffolded yet. When adding them, keep frontend, backend, tests, migrations, and static assets in clearly named top-level directories.

## Build, Test, and Development Commands

No build system or package manifest is present yet, so there are no native build, test, or dev commands. Useful repository checks are:

- `rg --files`: list tracked and untracked files visible to ripgrep.
- `git status --short`: inspect local changes before editing or committing.

When introducing `package.json`, `Makefile`, or equivalent tooling, add commands such as `npm run dev`, `npm test`, and `npm run build` here.

## Coding Style & Naming Conventions

Follow the PRD stack unless later decisions supersede it: TypeScript, React 19, Zustand, TanStack Query, Node.js/Express, REST JSON APIs, `pg`, and PostgreSQL 17.

Use 2-space indentation for TypeScript/JSON/Markdown. Prefer `camelCase` for variables and functions, `PascalCase` for React components and TypeScript types, and `UPPER_SNAKE_CASE` for enum values such as `PLANNED` and `IN_PROGRESS`. Keep Markdown headings descriptive and maintain UTF-8 encoding for Korean-language specification content.

## Testing Guidelines

No testing framework is configured yet. When implementation starts, add tests beside the code or under `tests/` using names such as `*.test.ts` or `*.spec.ts`. Cover business rules from `docs/1-domain-definition.md`, especially status transitions, authorization, KST date filtering, and category/team constraints.

## Commit & Pull Request Guidelines

Git history currently contains only `Initial commit`, so no project-specific convention has emerged. Use short imperative subjects, for example `Add PRD for todo workflows` or `Implement todo status validation`.

Pull requests should include a concise summary, affected docs or modules, validation performed, and linked issue or task ID when available. Add screenshots for UI changes once a frontend exists.

## Security & Configuration Tips

Do not commit secrets, database URLs, JWT keys, or MCP access tokens. Keep environment-specific values in ignored `.env` files and document required variables in an example file when runtime code is introduced.
