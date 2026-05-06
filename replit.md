# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

### `artifacts/college-platform` (`@workspace/college-platform`)

Arabic RTL React + Vite frontend for an educational platform (students, teachers, admin portals). Wired to an external **EducationalPlatformAPI** (.NET, OpenAPI 3.1.1) via a hand-written typed fetch client at `src/lib/external-api/`.

- **Base URL**: configurable via `VITE_API_BASE_URL`, defaults to `https://localhost:7079` (the spec's local dev URL).
- **Auth**: JWT bearer + refresh token persisted in `localStorage`; client auto-refreshes on `401` once via `/api/auth/refresh`.
- **Identity model**: user IDs are **UUID strings** (not numeric); roles array from server is mapped to the local `admin | teacher | student` enum (case-insensitive match against common role names).
- **Routing**: wouter under the artifact's BASE_URL prefix. Three role-themed portals share `Layout`.

#### Wired pages (Phase 1)
- Auth: `login.tsx`, `register.tsx` — hit `/api/auth/login` and `/api/auth/register`.
- Courses (admin/teacher): `pages/courses.tsx` + `pages/course-details.tsx` — `/api/courses`, `/api/courses/my`, `/api/courses/{id}`.
- Courses (student): `pages/student/courses.tsx` + `pages/student/course.tsx` — `/api/courses/enrolled`, `/api/courses/{id}`.
- Schedule: `pages/schedule.tsx` (admin CRUD) + `pages/student/schedule.tsx` — schedules are **embedded inside `CourseResponseDto.schedules`**, so we fetch all role-visible courses then aggregate via `useQueries`. CRUD via `/api/courses/{id}/schedules` and `/{sid}`.
- Video lectures: under `pages/course-details.tsx` and `pages/student/course.tsx` — `/api/courses/{id}/videos` (multipart upload), `…/publish`, `…/view`.
- Dashboards: `pages/dashboard.tsx` (teacher) and `pages/admin/dashboard.tsx` — derive stats from courses + `/api/users`.
- Admin lists: `pages/admin/teachers.tsx`, `pages/admin/students.tsx` — read-only filtered views over `/api/users`. `pages/admin/departments.tsx` derives departments from the `department` text field on courses.

#### Wired pages (Phase 3 — all 6 previously-stubbed pages now live)
- `pages/files.tsx` — teacher file library: lists `GET /api/files`, upload via `POST /api/courses/{id}/files` (multipart), delete via `DELETE /api/files/{id}`.
- `pages/student/files.tsx` — student file library: lists `GET /api/files/my`, filtered by course/category/search, download via `downloadUrl`.
- `pages/admin/departments.tsx` — full CRUD via `GET/POST /api/departments`, `PUT/DELETE /api/departments/{id}`. DepartmentResponseDto.id is UUID.
- `pages/admin/teachers.tsx` — create/edit/delete via `POST/PUT/DELETE /api/admin/teachers/{id}` in addition to existing activate/deactivate.
- `pages/admin/students.tsx` — create/edit/delete via `POST/PUT/DELETE /api/admin/students/{id}`, plus student activity panel via `GET /api/admin/students/{id}/activity`.
- `pages/admin/dashboard.tsx` — wired to `GET /api/admin/stats` (AdminStatsResponseDto) for real aggregate counts + top-courses tables.

#### New types added (Phase 3)
`CourseFileResponseDto`, `UpdateCourseFileDto`, `FilesQuery` (with index signature for query params), `DepartmentResponseDto` (id: UUID), `CreateDepartmentDto`, `UpdateDepartmentDto`, `CreateTeacherDto`, `UpdateTeacherDto`, `CreateStudentDto`, `UpdateStudentDto`, `StudentActivityDto`, `RecentActivityItemDto`, `AdminStatsResponseDto`, `TopCourseStatDto`, `DailyStatDto`, `ExamSummaryDto`, `FILE_TYPE_LABEL_AR`, `FileType` enum.

#### New API groups added (Phase 3)
`filesApi`, `departmentsApi`, `adminApi` — all in `src/lib/external-api/endpoints.ts`.
New query hooks: `useFiles`, `useMyFiles`, `useCourseFiles`, `useDepartments`, `useAdminStats`, `useStudentActivity` — in `src/lib/queries.ts`.

#### Notes on the API shape (gotchas)
- Numeric fields in DTOs (`credits`, `enrolledStudentsCount`, `videoLecturesCount`, `videoOrder`, `viewCount`, `durationSeconds`, paged-result counts) may be returned as **string or number** by the .NET serializer. Always coerce via the `asNumber()` helper from `@/lib/external-api`.
- `ScheduleResponseDto.dayOfWeek` is a string. The UI normalizes via a small Arabic/English/index map in `schedule.tsx` and `student/schedule.tsx`.
- `/api/courses` returns a `PagedResult<CourseSummaryDto>` (admins); `/my` and `/enrolled` return plain arrays.
- Refresh-token endpoint accepts the raw token as a JSON-encoded string body — handled via `rawJsonBody` in the fetch client.
