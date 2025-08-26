# Repository Guidelines

## Project Structure & Module Organization
- `main.js`: Electron main process and IPC handlers.
- `src/`: Renderer assets and UI.
  - `app.html`, `onboarding.html`, `preload.js`
  - `js/` (`app.js`, `onboarding.js`), `css/` (`style.css`), `assets/logos/`
- `docs/`: Static site for the project (GitHub Pages).
- `package.json`: Scripts, dependencies, and electron-builder config.

## Build, Test, and Development Commands
- `npm install`: Install dependencies (Node 18+ recommended).
- `npm start`: Run the app in development (Electron).
- `npm run pack`: Build unpacked app for local inspection.
- `npm run dist`: Create installers via electron-builder (macOS dmg, Windows nsis).

Examples:
```
# First run
npm install && npm start

# Build distributables
npm run dist
```

## Coding Style & Naming Conventions
- Indentation: 4 spaces; include semicolons; prefer single quotes in JS.
- Naming: `camelCase` for variables/functions, `PascalCase` for classes.
- Files: keep lowercase with hyphens or simple names (e.g., `preload.js`, `style.css`).
- Electron: keep `contextIsolation` on, use `preload.js` + `contextBridge`; avoid `nodeIntegration` in HTML.
- Keep CSP strict in HTML; serve static images via `asset://` as implemented.

## Testing Guidelines
- This repo relies on manual testing. For any change, include a clear manual test plan in the PR (steps and expected results).
- Validate core flows: onboarding selection, tab switching, drag-reorder with persistence, theme toggle, layout switch + resize handle, webview context menu, and relaunch state.
- Provide screenshots or a short GIF for visible UI changes.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and focused (e.g., "Add settings modal drag-to-resize").
- Branches: `feature/<topic>`, `fix/<issue>`, `chore/<task>`.
- PRs must include:
  - Clear description and rationale; link issues if applicable.
  - Before/after screenshots or a short GIF for UI changes.
  - Test plan (commands, steps), and any migration notes.
- Keep changes minimal; avoid adding new deps without discussion.

## Security & Configuration Tips
- Do not store secrets in `electron-store`; it persists user prefs only.
- Validate all IPC inputs; keep the exposed preload API minimal.
- Avoid relaxing CSP or enabling remote content beyond needed services.
- Icons/installers are configured in `package.json > build`; update there when adding assets.
