# AI Workflow Note

## Tools Used

- OpenAI Codex for planning, implementation, debugging, documentation, and verification support.
- Browser/manual QA planned for final reviewer-flow testing.
- Supabase and Vercel planned for hosted database and deployment.

## Where AI Sped Up The Work

- Converted the assessment prompt into a scoped product plan and acceptance checklist.
- Generated the initial Next.js/TypeScript implementation structure.
- Produced the API routes, storage abstraction, rich-text editor UI, and access-control test.
- Drafted reviewer-facing documentation and setup instructions.

## What AI Output Was Changed Or Rejected

- The initial plan included Prisma, but implementation used Supabase JS directly to reduce timebox risk and deployment complexity.
- Real-time collaboration, `.docx` import, and role-based permissions were rejected as over-scoped for the 4-6 hour target.
- Documentation was written to explicitly disclose the local fallback and the need for Supabase variables for durable live persistence.

## Verification Approach

- Ran `npm run test` for document access and sharing visibility logic.
- Ran `npm run lint` for code quality.
- Ran `npm run build` for a production Next.js compile/type-check.
- Browser-driven local QA verified create, rename, edit, formatting, save, refresh/reopen, upload, sharing, and owned/shared visibility.
- Live deployment persistence still needs verification after Supabase and Vercel are connected.
