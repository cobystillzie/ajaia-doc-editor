# Ajaia Collaborative Editor - Submission

## Live Product URL

https://ajaia-doc-editor-two.vercel.app

## Walkthrough Video

https://www.loom.com/share/276639bcce834c0f9c813b0448548f39

## Google Drive Folder

https://drive.google.com/drive/folders/1UgSrNDE8plIipgKJvF5znFXB60FKQ8Hr

## GitHub Repository

https://github.com/cobystillzie/ajaia-doc-editor

## Reviewer Users

No password is required. The app uses seeded demo users through the in-app user switcher:

- Coby Stillman: `coby@demo.com`
- Alex Reviewer: `alex@demo.com`

## What Is Included

- Source code ZIP
- `README.md` with local setup, Supabase setup, Vercel deployment details, reviewer users, and demo flow
- `ARCHITECTURE.md`
- `AI_WORKFLOW.md`
- `SUBMISSION.md`
- `WALKTHROUGH_VIDEO.txt`
- `LIVE_PRODUCT_URL.txt`
- `supabase-schema.sql`

## What Works End To End

- Create a new document
- Rename a document
- Edit document content in the browser
- Save, refresh, and reopen documents
- Preserve rich text formatting with structured TipTap JSON persisted in Supabase
- Bold, italic, underline, heading, bullet list, and numbered list formatting
- Upload `.txt` or `.md` files and import them as editable documents
- Share a document from Coby to Alex
- Switch to Alex and see shared documents under "Shared with me"
- Distinguish "Owned by me" from "Shared with me"
- Live deployment on Vercel with Supabase-backed persistence

## Intentional Scope Cuts

This is intentionally not a full Google Docs clone. I prioritized the core full-stack product slice over optional breadth.

Not included:

- Real-time multiplayer cursors or synchronous editing
- Google OAuth or account creation
- Comments or suggestion mode
- `.docx` import
- PDF export
- Complex role-based permissions
- Version history

## What I Would Build Next With Another 2-4 Hours

- Role-based sharing permissions, starting with viewer vs editor
- Document version history
- Export to Markdown or PDF
- A Playwright end-to-end test for the full reviewer flow
- Real-time collaboration only after evaluating a CRDT/WebSocket approach such as Yjs or Hocuspocus

## Engineering Quality And Verification

- Automated access/sharing test: `npm run test`
- Lint check: `npm run lint`
- Production build check: `npm run build`
- Browser-driven local QA passed
- Browser-driven live QA passed against the Vercel URL with Supabase persistence
- No secrets are committed. `.env.local` is ignored and the source package includes only `.env.example`.

## AI Workflow

I used AI to decompose the ambiguous prompt, compare scope options, accelerate implementation, debug issues, generate documentation, and build QA checklists. I changed AI-generated direction when it increased timebox risk, including choosing direct Supabase access instead of Prisma to reduce migration overhead. I verified correctness with tests, linting, production build checks, and browser-based QA instead of relying on AI output alone.
