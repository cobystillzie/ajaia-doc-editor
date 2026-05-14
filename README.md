# Ajaia Docs

A lightweight Google Docs-inspired collaborative editor built for the Ajaia assessment. It prioritizes a complete, testable product slice over broad Google Docs parity.

## What Works

- Create, rename, edit, save, refresh, and reopen documents.
- Rich text editing with bold, italic, underline, heading, bullet list, and numbered list controls.
- Upload `.txt` or `.md` files and import them as new editable documents.
- Share a document from the owner to another seeded user.
- Switch between seeded users and see separate "Owned by me" and "Shared with me" lists.
- Persist locally through a JSON fallback, or persist on deployment through Supabase Postgres.
- Run one meaningful automated test covering document access and sharing visibility.

## Seeded Reviewer Users

Use the user switcher in the left sidebar. There is no password or external auth.

| User | Email | Purpose |
| --- | --- | --- |
| Coby Stillman | `coby@demo.com` | Default owner account |
| Alex Reviewer | `alex@demo.com` | Share-recipient account |

## Local Setup

These steps assume you are on Windows and using PowerShell.

1. Open the project folder:

```powershell
cd "C:\Users\cobys\Documents\Codex\2026-05-14\is-this-a-public-pdf-link\ajaia-doc-editor"
```

2. Install dependencies:

```powershell
npm install
```

3. Start the local app:

```powershell
npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

5. Local persistence works immediately. The app creates `data/store.json` on first use. That file is ignored by Git.

## Optional Supabase Setup For Live Persistence

Use this before deploying to Vercel if reviewers need persistence on the live URL.

1. Go to Supabase and create a free project named `ajaia-doc-editor`.
2. Open the project.
3. Click **SQL Editor**.
4. Create a new query.
5. Paste the contents of `supabase-schema.sql`.
6. Click **Run**.
7. Click **Project Settings**.
8. Click **API**.
9. Copy:
   - Project URL
   - `service_role` key
10. Create `.env.local` in this project folder:

```powershell
copy .env.example .env.local
```

11. Open `.env.local` and replace the example values:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Do not commit `.env.local`. The `.gitignore` file excludes it.

## Useful Commands

```powershell
npm run dev
npm run test
npm run lint
npm run build
```

## Reviewer Demo Flow

1. Select `Coby Stillman`.
2. Click **New**.
3. Type formatted content using bold, italic, underline, heading, bullet list, and numbered list.
4. Click **Save**.
5. Refresh the page and reopen the document.
6. Click **Upload** and choose a `.txt` or `.md` file.
7. Open the imported document and confirm it is editable.
8. Open a Coby-owned document.
9. Click **Share**.
10. Grant access to `Alex Reviewer`.
11. Switch the user selector to `Alex Reviewer`.
12. Confirm the document appears under **Shared with me**.

## Vercel Deployment

1. Push this project to GitHub.
2. Go to Vercel.
3. Click **Add New Project**.
4. Import the GitHub repository.
5. Open **Environment Variables** before deploying.
6. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Click **Deploy**.
8. Open the deployed URL and repeat the reviewer demo flow.

If Supabase environment variables are not added, local development still works, but live deployment persistence is not guaranteed because Vercel serverless file storage is not durable.

## Scope Cuts

- No real-time multiplayer cursors.
- No Google OAuth or account creation.
- No comments or suggestion mode.
- No `.docx` import.
- No PDF export.
- No complex role-based permissions.

With another 2-4 hours, the next priorities would be live deployment QA with Supabase, document version history, a read-only viewer role, and a short Playwright browser test for the reviewer demo flow.
