# Submission Contents

## Included In This Project

- Source code for the Ajaia Docs full-stack Next.js app.
- GitHub repository: `https://github.com/cobystillzie/ajaia-doc-editor`
- `README.md` with local setup, Supabase setup, Vercel deployment steps, demo flow, and seeded users.
- `ARCHITECTURE.md` explaining product scope, stack, data model, and tradeoffs.
- `AI_WORKFLOW.md` explaining AI usage, rejected scope, and verification.
- `supabase-schema.sql` for hosted Supabase persistence.
- `WALKTHROUGH_VIDEO.txt` for the final unlisted video URL.
- Automated access/sharing test in `src/lib/access.test.ts`.

## Seeded Users

| User | Email |
| --- | --- |
| Coby Stillman | `coby@demo.com` |
| Alex Reviewer | `alex@demo.com` |

## Live Product URL

https://ajaia-doc-editor-two.vercel.app

Note: the live URL is deployed and Supabase-backed persistence has been verified.

## Walkthrough Video URL

https://www.loom.com/share/276639bcce834c0f9c813b0448548f39

## What Is Working

- Create, rename, edit, save, refresh, and reopen documents.
- Rich-text controls for bold, italic, underline, heading, bullet list, and numbered list.
- `.txt` and `.md` import into a new editable document.
- Seeded-user sharing from document owner to another user.
- Owned vs shared document lists.
- Local persistence fallback.
- Supabase schema and environment variable path for live persistence.

## Final Packaging Status

- Walkthrough video is recorded and linked.
- Google Drive folder: `https://drive.google.com/drive/folders/1UgSrNDE8plIipgKJvF5znFXB60FKQ8Hr`
- Before final submission, confirm the Google Drive folder is set to "Anyone with the link -> Viewer."

## Next 2-4 Hours

- Add document version history.
- Add read-only vs editor sharing roles.
- Add a Playwright end-to-end test for the full reviewer demo flow.
- Add export to Markdown.

## Final Acceptance Checklist

- [x] Verify create, rename, edit, save, refresh, and reopen for a formatted document. Local browser QA passed.
- [x] Verify bold, italic, underline, headings, bullet list, and numbered list work. Local browser QA passed.
- [x] Verify `.txt` or `.md` upload creates a new editable document. Local browser QA passed with `.md`.
- [x] Verify sharing from Coby to Alex works. Local browser QA passed.
- [x] Verify switching to Alex shows the document under "Shared with me." Local browser QA passed.
- [x] Verify owned vs shared documents are visibly distinct. Local browser QA passed.
- [x] Verify persistence works on the live deployment, not only locally. Live browser QA passed against Vercel with Supabase persistence.
- [x] Run at least one meaningful automated test.
- [x] Complete `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`, and `WALKTHROUGH_VIDEO.txt`.
- [x] Clearly document incomplete/stretch features and what would be built next in 2-4 hours.
- [x] Confirm no secrets are committed or included in Google Drive. Git contains only `.env.example`; `.env.local` is ignored.
- [x] Make sure reviewer credentials/seeded users are visible in `README.md` and `SUBMISSION.md`.
- [x] Add walkthrough video URL.

Local browser QA evidence: `QA Assessment 1778778182593` passed create/rename/edit/save/refresh/reopen, formatting, `.md` upload, share-to-Alex, and owned/shared visibility checks.

Live browser QA evidence: `Live QA 1778780377749` passed create/rename/edit/save/refresh/reopen, formatting, `.md` upload, share-to-Alex, and owned/shared visibility checks against `https://ajaia-doc-editor-two.vercel.app`.
