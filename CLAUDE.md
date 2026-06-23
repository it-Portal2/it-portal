# IT Portal

Role-based IT services portal for admins, developers, and clients — managing projects, payments, and applications with Gemini AI features. **Next.js 15.5.9** (App Router) · React 18 · TypeScript 5 · Firebase 11/Admin 12 · Tailwind 4 · shadcn/ui · Zustand 5.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — Next.js ESLint (note: build does NOT fail on lint errors)
- `npx tsc --noEmit` — type-check (no `typecheck` script exists; run manually)

No test runner is configured.

## Project Structure

```
app/
  actions/        — Server actions
  admin/          — Admin portal (requests, payments, candidates, settings)
  client/         — Client portal (projects, services, payment, chat)
  developer/      — Developer portal (projects, settings)
  api/            — API routes (setCustomClaims, analyzeResume, CORS helpers)
components/
  admin/          — Admin-specific components
  "client components"/  — Client-specific (directory name has a space — quote in bash)
  developer/      — Developer-specific
  ui/             — shadcn/ui generated components (do not hand-edit)
  ui-custom/      — Custom variants of shadcn components
  animate-ui/     — Animation components
  layout/         — Shared layout wrappers
lib/
  firebase/       — Firestore service modules split by role (admin, client, developer, common, authService)
  store/          — Zustand stores: userStore.ts, projectSteps.ts
  hooks/          — Custom React hooks
  gemini.ts / gemini-retry.ts — Gemini AI with key rotation + retry
  langchain.ts    — LangChain integration
firebase.ts       — Client SDK init (browser)
firebaseAdmin.ts  — Admin SDK init (server-only)
middleware.ts     — Auth + role guard (Node.js runtime, not edge)
```

Import alias: `@/` maps to the **repo root** (not `src/`).

## Conventions

- **Roles**: `admin`, `subadmin`, `developer`, `client`. `subadmin` has the same access as `admin` in the middleware.
- **Auth flow**: Firebase Auth token stored in `firebaseToken` cookie (httpOnly: false). Middleware verifies with firebase-admin; falls back to Firestore `users` collection if no role claim on the token.
- **Role assignment**: Custom claims are set via `POST /api/setCustomClaims`. New users won't have claims until this runs.
- **Gemini keys come from Firestore, not `.env`**: `lib/gemini.ts` calls `getActiveGoogleAIKeys()` which reads the `aiKeys` Firestore collection. Add/enable keys via Admin Panel → Settings → Manage AI Keys. The `GOOGLE_API_KEY_*` values in `.env` are not used by the AI pipeline.
- **shadcn/ui**: New-York style, Tailwind CSS variables. Add components with `npx shadcn@latest add <name>`. Do not manually edit files under `components/ui/`.
- `trailingSlash: true` in next.config — all internal `<Link href>` values must end with `/`.
- Middleware runtime is explicitly `nodejs` — do not change to `edge`; firebase-admin requires Node.js.

## Required Environment Variables

Server-only (Firebase Admin):
```
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY    # contains literal \n — firebaseAdmin.ts already handles the replace
FIREBASE_CLIENT_EMAIL
```

Client-side (`NEXT_PUBLIC_`):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Cross-origin:
```
NEXT_PUBLIC_VITE_DEV_URL            # External Vite app (localhost:5173 in dev)
NEXT_PUBLIC_VITE_PROD_URL           # External Vite app (production URL)
```

`.env` is git-ignored (`.env*` in `.gitignore`). There is no `.env.example` — a new contributor must obtain all values from the team. The `FIREBASE_PRIVATE_KEY` value must stay single-line with literal `\n`.

## Gotchas

- **No test suite**: There is no `npm test` — write tests manually if needed, or skip the test step.
- **ESLint doesn't block builds**: `eslint.ignoreDuringBuilds: true` is set — run `npm run lint` explicitly before pushing.
- **Space in directory name**: `components/client components/` — bash commands must quote this path.
- **Trailing slash**: `trailingSlash: true` is active — omitting it causes 308 redirects in production.
- **Image optimization disabled**: `images: { unoptimized: true }` — `<Image>` from next/image works but won't optimize.
- **Token cookie is not httpOnly**: `firebaseToken` cookie is readable by client JS (required for the Vite cross-origin app to pass tokens via URL params).
- **Cloudinary credentials are hardcoded** in [lib/cloudinary.ts](lib/cloudinary.ts) (`cloud_name: "db9um0dp4"`, `upload_preset: "AllPDF"`). Changing the Cloudinary account requires editing that file directly — there is no env var for it.

## Verification

After changes, run in order (show actual output — don't assert success):
1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

<!-- When Claude is corrected on a project-specific convention, add the correction here. -->

## Performance work log

**Status: COMPLETE** — all 5 phases implemented on branch `perf/dashboard-optimizations` (6 commits, not yet merged to `main`). Each phase verified with `npx tsc --noEmit` (0 errors) + `npm run build` (success) + an independent diff review-agent pass before commit. No automated test suite exists in this repo, so behavioral QA is manual; the build/type/review gate is the automated safety net. One commit per phase; no Claude/AI commit attribution.

Implements the audit in `~/.claude/plans/identify-in-detail-think-federated-yeti.md`. Goal: instant-feeling navigation and CRUD, fresh data after every mutation with no manual reload, and loading feedback on every async action — verified against the live Next.js 15.5 / React 18 docs.

> Note: `npm run lint` is unconfigured in this repo (no ESLint config; `next lint` prompts interactively) and `build` ignores lint (`eslint.ignoreDuringBuilds: true`), so the gate relied on `tsc` + `build`. The only build warning is from `@langchain/community` in node_modules (pre-existing).

- **Phase 1 — Loading & error UI:** Added `loading.tsx` skeletons across all admin/client/developer route segments + `error.tsx` boundaries per role. Shared skeletons in [components/ui-custom/page-skeletons.tsx](components/ui-custom/page-skeletons.tsx) and [components/ui-custom/error-state.tsx](components/ui-custom/error-state.tsx). No logic changes.
- **Phase 2 — Dynamic detail pages:** Removed `generateStaticParams()` from all 7 `[id]` detail pages (admin requests/ongoing/completed/rejected/candidate-application, client projects, developer projects) so they render on-demand (`ƒ`) instead of SSG — newly-created records open without blocking full-collection pre-generation. Per-id fetch wrapped in React `cache()`. Fetch/error logic and client props unchanged.
- **Phase 3 — Post-mutation freshness:** Candidate accept/reject now calls `router.refresh()` (status is prop-derived) so the change shows immediately. Replaced the `window.location.reload()` in ongoing-project document add/remove with `router.refresh()` (no full-page flash). Lowered `revalidate` 100/200 → 30 on all 9 list/dashboard pages; freshness comes from `revalidatePath` + `router.refresh()` on mutation. Existing local-`setState` flows (payments dialog, developer tasks, client settings) left as-is.
- **Phase 4 — Button pending states:** New reusable [components/ui-custom/loading-button.tsx](components/ui-custom/loading-button.tsx) (`loading`/`loadingText` → spinner + disabled). Applied to the 9 mutation buttons (accept/reject project, mark completed, accept/reject candidate, verify/reject payment, generate tasks, update progress) driven by local `useState` flags (React 18; `useActionState`/`useOptimistic` are React 19, unavailable). Prevents double-submits and gives visible feedback.
- **Phase 5 — Bundle & nav:** Hoisted Sidebar nav-link arrays to module scope (no per-render rebuild). Lazy-loaded heavy PDF libs: `jspdf`+`html2canvas-pro` via dynamic `import()` inside the candidate report handler (route JS ~190 kB → ~12.5 kB), and `react-pdf` `PdfViewer` via `next/dynamic({ssr:false})` in the create-project flow (~167 kB → ~67 kB). Added a PERF note in `middleware.ts` about setting role custom claims to skip the per-request Firestore read (claim-setting is upstream — no middleware logic changed). Deferred (documented): layout server-componentization and `images.unoptimized` (Cloudinary/external images — needs a loader; out of scope for a no-logic-change pass). `components/ui/chart.tsx` (recharts) is unused/dead — left as-is.

### Fixes found during smoke-testing
- **Settings tabs Timestamp serialization** (`lib/firebase/admin.ts`): `getAllClients`/`getAllSubadmins`/`getAllDevelopers` spread raw Firestore doc data whose `createdAt`/`lastLogin`/`updatedAt` are Firestore `Timestamp` class instances → "Only plain objects can be passed to Client Components" error, breaking the Clients/Developers/Subadmins settings tabs. Fixed by wrapping `doc.data()` in the file's existing `convertTimestamp()` helper (already used by the project/application fetchers) so timestamps become ISO strings. (Pre-existing bug, not caused by the perf work.)
- **Dev-only `.next` cache corruption:** after adding ~23 `loading.tsx` files + a `next/dynamic` import while the dev server was running, the dev server threw `Cannot read properties of undefined (reading 'call')` and a `next-devtools/.../segment-explorer-node.js` "module not in React Client Manifest" error. This is a stale-dev-cache symptom, **not** a code bug (production `build` is clean). Fix: stop dev server, `rm -rf .next` (optionally `node_modules/.cache`), restart `npm run dev`.

### Remaining (not blocking)
- User manual smoke-test of the flows above; then push branch / open PR / merge to `main` (branch is 6 commits ahead, unpushed).
- **Phase 6** (Next.js 16 + React 19 upgrade) is a separate future workstream — see the plan file.

## Auth flow log

Branch `fix/auth-flow` (off `perf/dashboard-optimizations`) fixes login/signup/logout timing bugs. Plan: `~/.claude/plans/identify-in-detail-think-federated-yeti.md`. Gate: `tsc` + `build` + review agent. No Claude/AI commit attribution.

- **Track A — login/signup/logout UX (done):** Root cause was navigation fired-but-not-awaited + page content not gated on auth (only the sidebar was). Fixes: (1) [components/layout/Layout.tsx](components/layout/Layout.tsx) is now an auth gate — full-screen loader ([components/ui-custom/full-screen-loader.tsx](components/ui-custom/full-screen-loader.tsx)) while `!isInitialized`, and `router.replace("/")` + loader when `!isAuthenticated`, so the dashboard no longer flashes on login or lingers on logout. (2) `logout()` in [lib/hooks/useAuth.ts](lib/hooks/useAuth.ts) now `resetAuth()`-first then `signOut` + `/api/clearCookie` + hard redirect `window.location.href="/?loggedout=1"` (clean teardown; toast shown on arrival). (3) Auth handlers in [app/page.tsx](app/page.tsx) keep the button pending through navigation and no longer fire a success toast over a still-loading dashboard; post-auth nav uses `router.replace`. (4) signup / new Google users `await setCustomClaims` + refresh token so the role claim is on the token (middleware skips its Firestore fallback → faster first load).
- **Track A follow-up (done):** Fixed two regressions from the gate — (1) logout double-refresh (the gate's `router.replace("/")` **and** a `window.location.href` hard redirect both fired) → removed the hard redirect, the gate is now the single navigation; logout sets a `sessionStorage` `loggedOut` flag and the auth page shows the toast on arrival. (2) First-visit full-page loader hiding the sidebar → the gate now renders the shell as soon as a **persisted `profile`** exists (only shows the full loader when there's no profile at all), so the sidebar/header stay and only the page content shows its route skeleton.
- **Track B — auth-cookie httpOnly hardening: NOT YET DONE** (separate pass). The `firebaseToken` cookie is still JS-readable. Must first locate the cross-origin Vite token handoff (CLAUDE.md gotcha) and switch it to an on-demand token before flipping httpOnly.
