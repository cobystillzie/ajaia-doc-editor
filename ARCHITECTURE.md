# Architecture Note

## Product Slice

Ajaia Docs is a focused collaborative document workspace. The product demonstrates document creation, rich-text editing, file import, sharing, and persistence without attempting full Google Docs parity.

## Stack

- **Next.js + React + TypeScript:** one full-stack app for UI and API routes.
- **Tailwind CSS:** fast, consistent product UI styling.
- **TipTap:** rich-text editor with JSON/HTML document persistence.
- **Supabase Postgres:** hosted persistence path for live deployment.
- **Local JSON fallback:** lets reviewers run the app locally without paid services or database setup.
- **Vitest:** focused automated test for access/sharing behavior.

## Data Model

- `users`: seeded demo users.
- `documents`: title, TipTap JSON, HTML preview, owner, timestamps.
- `document_shares`: grants another seeded user access to a document.

Owners can rename and share documents. Shared users can open and edit shared content, but the UI reserves sharing and renaming for owners.

## Prioritization

The first engineering priority was the editor persistence loop: create, edit, save, refresh, and reopen while preserving formatting. This is the highest-risk core behavior. Upload and sharing were then added as product-relevant extensions around that document model.

## Tradeoffs

- Mock users were chosen over full authentication to keep the review flow fast and avoid account setup friction.
- `.txt` and `.md` import were chosen over `.docx` because they are reliable in a short timebox and still demonstrate file handling.
- Supabase JS was used directly instead of Prisma to reduce setup and migration overhead for a timed assessment.
- Real-time collaboration, comments, suggestions, and version history were intentionally deferred.
