import { describe, expect, it } from "vitest";
import { canAccessDocument, getVisibleDocuments } from "./access";
import type { DocumentRecord, DocumentShare, User } from "./types";

const users: User[] = [
  { id: "coby", name: "Coby Stillman", email: "coby@demo.com" },
  { id: "alex", name: "Alex Reviewer", email: "alex@demo.com" },
  { id: "sam", name: "Sam Observer", email: "sam@demo.com" },
];

const documents: DocumentRecord[] = [
  {
    id: "doc-1",
    title: "Owned brief",
    contentJson: { type: "doc" },
    contentHtml: "<p>Owned brief</p>",
    ownerId: "coby",
    createdAt: "2026-05-14T12:00:00.000Z",
    updatedAt: "2026-05-14T12:00:00.000Z",
  },
  {
    id: "doc-2",
    title: "Shared plan",
    contentJson: { type: "doc" },
    contentHtml: "<p>Shared plan</p>",
    ownerId: "alex",
    createdAt: "2026-05-14T12:01:00.000Z",
    updatedAt: "2026-05-14T12:01:00.000Z",
  },
];

const shares: DocumentShare[] = [
  {
    id: "share-1",
    documentId: "doc-2",
    userId: "coby",
    createdAt: "2026-05-14T12:02:00.000Z",
  },
];

describe("document access rules", () => {
  it("shows owned and shared documents while excluding unrelated documents", () => {
    const visible = getVisibleDocuments(documents, shares, users, "coby");

    expect(visible.owned.map((document) => document.id)).toEqual(["doc-1"]);
    expect(visible.shared.map((document) => document.id)).toEqual(["doc-2"]);
    expect(visible.shared[0]).toMatchObject({
      access: "shared",
      ownerName: "Alex Reviewer",
    });
  });

  it("allows owners and granted users but rejects unshared users", () => {
    expect(canAccessDocument(documents[0], shares, "coby")).toBe(true);
    expect(canAccessDocument(documents[1], shares, "coby")).toBe(true);
    expect(canAccessDocument(documents[1], shares, "sam")).toBe(false);
  });
});
