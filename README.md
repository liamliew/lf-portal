# LF Portal

Internal client delivery portal for LF Creative. Upload project files, share them with clients via secure links, and manage all deliverables from one place.

## Stack
- Next.js 16 App Router + TypeScript
- Clerk v7 (admin auth)
- Supabase (Postgres + RLS)
- MinIO (self-hosted S3-compatible storage)
- Tailwind CSS 4 + shadcn/ui (base-nova)

## Features
- Project management with file uploads
- NAS — unified file storage across multiple drives
- Versioned files (upload same filename = new version)
- Secure share links with optional password, PIN, and expiry
- Public share page for clients (no account required)

## Environment Variables
Copy .env.example to .env.local and fill in:
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET

## Development
```bash
npm install
npm run dev
```

## Production
```bash
npm run build
npm start
```
