<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: lf-portal

A client portal for **LF Creative** — a production company. Admins upload project files, create protected share links, and clients access deliverables via public share URLs. No client accounts; access is token + optional password/PIN.

**Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Clerk v7, Supabase (Postgres), MinIO (self-hosted S3 at `192.168.1.192:9100`)

---

## Critical conventions

### Routing middleware → `proxy.ts`

Next.js 16 deprecates `middleware.ts`. The interception layer is now `proxy.ts` at the project root. The default export is the handler (no rename required). This project already uses `proxy.ts`.

### Clerk auth — always `await auth.protect()`

`auth.protect()` is **async** (returns `Promise<SignedInAuthObject>`). The handler passed to `clerkMiddleware` must be `async` and must `await auth.protect()`. Failing to await causes the `NEXT_REDIRECT` rejection to escape Clerk's internal catch, resulting in an unhandled promise rejection.

```ts
// proxy.ts — correct pattern
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})
```

### Clerk keyless mode

`NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true` is set in `.env.local` to prevent Clerk from falling into keyless/bootstrap mode in development. Do not remove it.

### Server vs client components

- Pages are **server components** by default — they fetch data and pass it down as props.
- Add `"use client"` only for components that need interactivity: forms, modals, file inputs, clipboard, `useRouter`, `useState`.
- Never call server actions inside server components — pass fetched data as props instead.

### Supabase client

`lib/supabase.ts` exports a single service-role client (`SUPABASE_SERVICE_ROLE_KEY`). This client has full DB access and must only be used server-side (server components, server actions). Never import it in `"use client"` files.

### Server actions ownership checks

Every server action that reads or mutates data verifies the signed-in user owns the resource before touching the DB. Pattern: fetch the project by `id` AND `created_by = userId`, return null/throw if not found. This pattern is in every action in `app/actions/`.

### Public share page — no Clerk auth

`app/(share)/share/[token]/` is a completely public route. Do **not** add Clerk auth checks there. Downloads use `getSharedPresignedUrl(token, fileId)` from `app/actions/shares.ts` (not `getPresignedUrl` which requires a Clerk session).

---

## Services & environment

**Clerk v7** — Admin auth (sign-in/sign-up, session)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true`

**Supabase** — Postgres database (service role, server-only)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**MinIO** — Object storage (self-hosted S3-compatible at `192.168.1.192:9100`)

- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

---

## Database schema

```sql
projects
  id          UUID PRIMARY KEY
  name        TEXT
  description TEXT
  created_by  TEXT   -- Clerk userId
  created_at  TIMESTAMPTZ

project_files
  id           UUID PRIMARY KEY
  project_id   UUID REFERENCES projects(id)
  filename     TEXT   -- original file name, used to group versions
  storage_path TEXT   -- MinIO key: "{projectId}/{filename}_v{version}"
  size         BIGINT -- bytes
  mime_type    TEXT
  version      INT    -- increments per filename per project
  uploaded_at  TIMESTAMPTZ

project_shares
  id            UUID PRIMARY KEY
  project_id    UUID REFERENCES projects(id)
  token         TEXT        -- 64-char hex (32 random bytes), used in /share/{token}
  password_hash TEXT        -- bcrypt hash, NULL if no password
  pin           TEXT        -- bcrypt hash of PIN, NULL if no PIN
  expires_at    TIMESTAMPTZ -- NULL means never expires
  created_at    TIMESTAMPTZ
```

Versioning: uploading a file with the same `filename` to the same project creates a new row with `version + 1`. `getFiles()` groups rows by `filename` and returns them sorted version desc.

---

## Route structure

```text
proxy.ts                          — Clerk middleware, protects /dashboard/**

app/
  layout.tsx                      — Root layout: Clerk provider, fonts (Manrope display, JetBrains Mono)
  page.tsx                        — Redirects / → /dashboard

  (admin)/
    layout.tsx                    — Admin shell: <Sidebar /> + <main>
    dashboard/
      page.tsx                    — Dashboard home: KPIs, recent uploads, active projects, share links
      projects/
        page.tsx                  — Project list with per-project file/share/size stats
        projects-client.tsx       — Client: create project modal, delete with confirm
        [id]/
          page.tsx                — Project detail: fetches project, files (grouped), shares
          project-detail-client.tsx — Client: file table, upload, delete, download, share modal, inline edit name
          files/[fileId]/
            page.tsx              — File detail: fetches file + all versions by filename
            file-detail-client.tsx — Client: version selector, download, share modal, fake player UI
      files/
        page.tsx                  — All files across all projects (server fetch)
        files-client.tsx          — Client: search filter, download button
      shares/
        page.tsx                  — All share links across all projects (server fetch)
        shares-client.tsx         — Client: copy token URL, revoke with confirm, expired highlighted

  (share)/
    share/[token]/
      page.tsx                    — Public: checks token validity/expiry, detects password/PIN requirement
      share-client.tsx            — Client: auth form (password + PIN), file list with version selector, download

  sign-in/[[...sign-in]]/page.tsx — Clerk <SignIn /> with custom LF Creative branding (two-panel layout)
  sign-out/[[...sign-up]]/page.tsx — Auto sign-out on mount, redirects to /sign-in

app/actions/
  projects.ts — getProjects, createProject, updateProject, deleteProject
  files.ts    — getFiles, uploadFile, deleteFile, getPresignedUrl
  shares.ts   — createShare, getShares, deleteShare, validateShare, getSharedPresignedUrl

lib/
  supabase.ts  — Supabase service-role client (server-only)
  minio.ts     — AWS S3 client pointed at MinIO, exports s3 + BUCKET
  mock-data.ts — Legacy types/data. No longer imported by any page. Keep for reference only.

components/
  sidebar.tsx     — Nav: Dashboard, Projects, All files, Share links
  topbar.tsx      — Breadcrumb bar with search input
  icon.tsx        — SVG icon set (~24 icons)
  share-modal.tsx — Create share link modal: expiry, PIN, password toggles
```

---

## Data flow

### Admin reading data (server component)

```text
Page (server component)
  → await auth() from @clerk/nextjs/server  →  get userId
  → supabase query (service role, server-only)
  → pass data as props to client component
```

### Admin mutating data (client component)

```text
Client component (event handler)
  → call server action (app/actions/*.ts)
      → auth() inside action — re-verify ownership
      → supabase mutation
      → MinIO mutation if needed
  → router.refresh() — re-fetches current page data from server
```

### Public share flow

```text
/share/[token] page (server component, no Clerk)
  → supabase: fetch share by token
  → if expired   → show "This link has expired"
  → if not found → show "Link not found"
  → if password/PIN required → pass flags to ShareClient, show auth form
  → if no auth required → call validateShare(token) → pass data to ShareClient

ShareClient (client component)
  → form submit → validateShare(token, password, pin)  [server action]
      → bcrypt.compare password/PIN hashes
      → fetch project_files grouped by filename
      → return { project, files (grouped), shareId }
  → download click → getSharedPresignedUrl(token, fileId)  [server action]
      → verify token valid + not expired
      → verify file.project_id matches share.project_id
      → getSignedUrl from MinIO (1 hour expiry)
      → window.open(url)
```

### File versioning

- Upload detects existing rows with same `filename` in same `project_id`
- Takes `MAX(version) + 1`, or starts at 1
- Storage key: `{projectId}/{filename}_v{version}`
- `getFiles(projectId)` returns `Record<filename, FileRow[]>` sorted version desc
- UI shows latest version in list; clicking a file shows version history panel

### Share link security

- Token: 64-char hex from `crypto.randomBytes(32)` — unguessable
- Password stored as `bcrypt.hash(password, 10)`
- PIN stored as `bcrypt.hash(pin, 10)` in the `pin` column
- `getSharedPresignedUrl` does **not** re-check password/PIN — it only verifies the token is valid and not expired, and that the requested file belongs to that project. This is intentional: the client already ran `validateShare` which checked credentials.

---

## Component patterns

### File table layout

The `file-table` CSS class uses CSS grid. The default column template in admin pages is:

```text
checkbox | name+icon | version | size | modified | sharing | actions
```

The share page and All Files page override `gridTemplateColumns` via inline style to match their column sets.

### Inline edit (project name/description)

`project-detail-client.tsx` uses `contentEditable` on an `<h1>` with an `onBlur` handler that calls `updateProject()` if the value changed.

### Upload progress

`project-detail-client.tsx` tracks `isUploading` state. The button text changes to "Uploading..." and is disabled. There is no byte-level progress bar — it's an indeterminate state toggle.

### Share modal

`components/share-modal.tsx` — used in both `project-detail-client.tsx` and `file-detail-client.tsx`. Required props: `projectId`, `onClose`, `onSuccess`. After `createShare()` succeeds the modal switches to a "copy URL" view; `onSuccess` is called when the user clicks Done.

---

## Styling

- No CSS framework component library (no shadcn, no Radix). Custom CSS only.
- Design tokens live in `app/globals.css` as CSS custom properties: `--accent`, `--surface`, `--border`, `--text-strong`, `--text-muted`, `--text-faint`, `--font-display`, `--font-mono`, etc.
- Key utility classes: `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-sm`, `chip`, `chip-active`, `chip-success`, `chip-accent`, `card`, `card-hd`, `file-table`, `file-row`, `file-name-cell`, `file-version`, `modal`, `modal-back`, `toolbar`, `kpi`, `kpi-grid`, `dash-grid`, `proj-hd`, `fd-layout`, `fd-preview`, `fd-rail`, `sidebar`, `sb-item`.
- **Do not modify `globals.css`** unless adding a new reusable component class.
- Fonts: `var(--font-display)` = Manrope (headings), `var(--font-mono)` = JetBrains Mono (codes, metadata, version tags).
