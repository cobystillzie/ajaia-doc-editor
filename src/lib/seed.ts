import type { DocumentRecord, StoreData, User } from "./types";

export const DEMO_USERS: User[] = [
  {
    id: "coby",
    name: "Coby Stillman",
    email: "coby@demo.com",
  },
  {
    id: "alex",
    name: "Alex Reviewer",
    email: "alex@demo.com",
  },
];

export const EMPTY_DOC_CONTENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Start writing your document here.",
        },
      ],
    },
  ],
};

export function nowIso() {
  return new Date().toISOString();
}

export function createSeedDocument(): DocumentRecord {
  const timestamp = nowIso();

  return {
    id: "welcome-doc",
    title: "Ajaia assessment notes",
    contentJson: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Ajaia collaborative editor" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This starter document demonstrates " },
            { type: "text", marks: [{ type: "bold" }], text: "rich text" },
            { type: "text", text: ", persistence, upload, and sharing flows." },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Create and save documents" }] }],
            },
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Share with Alex Reviewer" }] }],
            },
          ],
        },
      ],
    },
    contentHtml:
      "<h1>Ajaia collaborative editor</h1><p>This starter document demonstrates <strong>rich text</strong>, persistence, upload, and sharing flows.</p><ul><li><p>Create and save documents</p></li><li><p>Share with Alex Reviewer</p></li></ul>",
    ownerId: "coby",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createInitialStore(): StoreData {
  return {
    users: DEMO_USERS,
    documents: [createSeedDocument()],
    shares: [],
  };
}

export function plainTextToTipTapDoc(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());

  const content = lines.length
    ? lines.map((line) => ({
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : undefined,
      }))
    : [{ type: "paragraph" }];

  return {
    type: "doc",
    content,
  };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function plainTextToHtml(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}
