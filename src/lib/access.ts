import type { DocumentRecord, DocumentShare, DocumentSummary, User, VisibleDocuments } from "./types";

export function canAccessDocument(document: DocumentRecord, shares: DocumentShare[], userId: string) {
  return document.ownerId === userId || shares.some((share) => share.documentId === document.id && share.userId === userId);
}

export function canManageDocument(document: DocumentRecord, userId: string) {
  return document.ownerId === userId;
}

export function toDocumentSummary(
  document: DocumentRecord,
  access: "owned" | "shared",
  users: User[],
): DocumentSummary {
  return {
    ...document,
    access,
    ownerName: users.find((user) => user.id === document.ownerId)?.name ?? "Unknown owner",
  };
}

export function getVisibleDocuments(
  documents: DocumentRecord[],
  shares: DocumentShare[],
  users: User[],
  userId: string,
): VisibleDocuments {
  const owned = documents
    .filter((document) => document.ownerId === userId)
    .map((document) => toDocumentSummary(document, "owned", users));

  const shared = documents
    .filter((document) => document.ownerId !== userId)
    .filter((document) => shares.some((share) => share.documentId === document.id && share.userId === userId))
    .map((document) => toDocumentSummary(document, "shared", users));

  return {
    owned: sortDocuments(owned),
    shared: sortDocuments(shared),
  };
}

function sortDocuments(documents: DocumentSummary[]) {
  return [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
