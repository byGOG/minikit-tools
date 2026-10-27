# MiniKit agent team

## Scope and coordination

The user requested a MiniKit specialist team, including a dedicated new-tool builder and useful supporting roles. The role pool contains seven profiles: maintenance development, new-tool building, product research, SEO/content, UX/accessibility, analytics/growth, and quality/security. For nontrivial work with independent parts, select the relevant roles, delegate bounded tasks, and wait for their results. Small dependent tasks can stay with the coordinator. Keep at most three specialists active alongside the coordinator; seven available profiles do not mean seven concurrent workers. Do not spawn nested teams.

For a new-tool request, check the catalog for duplicates, use product research when selection needs evidence, then assign implementation to minikit_tool_builder. Use SEO/content for locale/guide work and quality/security for independent acceptance tests. The coordinator stages these roles within the three-specialist cap and owns shared-file assignments. When the user delegates tool selection, choose a reasonable candidate and complete it rather than stopping at a proposal. UX/accessibility reviews usability; analytics/growth evaluates source-backed outcomes when relevant data is available.

Project roles live in `.codex/agents/`. Operational context and the shared backlog live in `docs/team/TEAM.md` and `docs/team/BACKLOG.md`. Model/reasoning settings inherit from the parent unless the user explicitly requests otherwise. These files define reusable roles; they do not start a daemon or create a recurring schedule.

The coordinator owns task selection, file ownership, integration, relevant verification, Git commits, pull requests and publication. Assign disjoint writable files before parallel edits. Specialists report evidence and results; do not let multiple agents modify the same file at once. Use a separate managed worktree when isolation is actually needed. Preserve unrelated user work.

Carry existing user authorization forward. Agent review and CI are engineering checks, not a new human-approval requirement. Complete authorized work without repeatedly asking for confirmation. Do not create periodic runs, send messages to other chats or add services outside the user's scope.

## Product contracts

- Keep all 85 tools and 50 locale routes working unless the user changes scope. Derive current counts from `src/data/tools.json` and `src/i18n/catalog.json` when tools are added.
- Published homepages are searchable directories. Each tool page contains one form plus related links; do not restore all forms to every page.
- Tool input, file contents, filenames and generated results stay in the browser. Do not add telemetry containing them.
- Use existing dictionaries and translated limit messages. Examples must match actual tool behavior, including locale-sensitive case conversion and exact numbers.
- In async tools, invalidate stale work on input changes, publish only current results and release temporary resources on success and failure.
- Advertising stays governed by the existing approval/CMP configuration. Do not infer approval or income from successful builds.

## Verification and delivery

Use `pnpm run check`, focused unit/browser tests, a Cloudflare build and locale tests as appropriate. Browser tests use the pinned Playwright container in CI. Do not add tests that merely mirror a low-impact implementation. A full publication should pass the relevant checks and receive coordinator review before merging. Verify the live behavior after publication; distinguish local, preview and production results.

Use the current Node engine requirement and `.node-version`; see README. Keep source and instructions free of credentials. Report changes, validation and material limitations in Turkish for this user. Keep reports concise and avoid re-opening completed investigations without new evidence.
