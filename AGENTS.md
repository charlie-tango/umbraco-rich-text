# AGENTS.md

`@charlietango/umbraco-rich-text` is a React component and utility for rendering
rich-text JSON returned by the Umbraco Content Delivery API. It's published to
npm as ESM+CJS via unbuild, with `html-entities` as its only runtime dependency
and React 18/19 as a peer dependency. For API docs, props, and usage examples,
see [README.md](./README.md) — this file is for contributors and agents working
on the codebase.

## Commands

```bash
pnpm install                              # install dependencies
pnpm lint                                 # Biome lint + format check
pnpm typecheck                            # tsc --noEmit
pnpm exec playwright install chromium     # once, before running tests
pnpm exec vitest run                      # run the full test suite
pnpm exec vitest run -u                   # update snapshots (inspect diffs first)
pnpm build                                # unbuild -> dist/
```

Note: the bare `pnpm test` script starts vitest in watch mode, which isn't
useful outside CI — prefer `pnpm exec vitest run`.

## Architecture

All source lives in `src/rich-text/`:

- `UmbracoRichText.tsx` — the main React component.
- `rich-text-converter.ts` — plain-text conversion utility.
- `RichTextTypes.ts` — type guards and data models.
- `attributes-map.ts` — HTML-to-React attribute name mapping.
- `parse-style.ts` — inline `style` string parser.

`src/index.ts` is the public API surface (currently 4 exports); renaming or
removing an export is a breaking change. `examples/UmbracoRichText/` is a
private Vite demo app in the pnpm workspace, not part of the published package.

## Conventions

- Formatting/linting is enforced by Biome (`pnpm lint`). `noArrayIndexKey` is
  intentionally disabled — index keys are fine for static CMS content.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).
- `UmbracoRichText` is deliberately hook-free, so it can be used in React Server
  Components. Do not introduce hooks into it.
- Consumers augment block item types via declaration merging on the
  `UmbracoBlockItemModel` interface, so renaming exported types is breaking.
- Tests use two vitest projects: "node" (`*.test.ts`) and "browser"
  (`*.browser.test.tsx`, real Chromium via Playwright + vitest-browser-react).
  Shared fixture:
  `src/rich-text/__tests__/__fixtures__/UmbracoRichText.fixture.json`. Inspect
  snapshot diffs before running `vitest run -u`.

## Releases

Releases are cut locally with `pnpm release` (`bumpp` bumps the version,
commits, tags, and pushes; `npm publish` then publishes the package). The pushed
`v*` tag also triggers `.github/workflows/release.yml`, which currently
generates GitHub release notes via `changelogithub`. Agents must never run
`pnpm release`, `bumpp`, or `npm publish` — releases are a maintainer-only
action.
