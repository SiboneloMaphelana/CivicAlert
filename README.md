# CivicAlert

## Product summary

CivicAlert is a **neighborhood civic reporting** web app. Residents can browse and file issues, mark **same issue** support, and flag reports for moderator review. **Moderators** use a dedicated queue to triage items, change status, and leave official notes.

All data lives in **client-side demo state** (NgRx with optional local persistence). There is no real server API—use this repo to explore UX and workflows, not as a production backend.

## Stack

| Area | Technology |
|------|------------|
| Framework | [Angular](https://angular.dev) 21 |
| State | [NgRx](https://ngrx.io) Store (+ DevTools in dev) |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| Rendering | Angular **SSR** + client hydration |
| HTTP / SSR host | [Express](https://expressjs.com) 5 |
| Unit tests | [Vitest](https://vitest.dev) (via Angular CLI) |
| Language | TypeScript 5.9 |

Tooling: Angular CLI 21, Prettier, PostCSS.

## Setup

**Requirements:** Node.js (LTS recommended) and **npm** 11+ (see `package.json` `packageManager`; enable with [Corepack](https://nodejs.org/api/corepack.html) if you pin versions).

**Install dependencies:**

```bash
npm install
```

**Local development** (dev server with hydration):

```bash
npm start
```

Open [http://localhost:4200/](http://localhost:4200/).

**Production build** (output in `dist/CivicAlert/`):

```bash
npm run build
```

**Run the built SSR server locally:**

```bash
npm run serve:ssr:CivicAlert
```

**Unit tests:**

```bash
npm test
```
