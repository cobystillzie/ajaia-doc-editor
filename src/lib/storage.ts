import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canAccessDocument, canManageDocument, getVisibleDocuments } from "./access";
import { createInitialStore, DEMO_USERS, EMPTY_DOC_CONTENT, nowIso, plainTextToHtml, plainTextToTipTapDoc } from "./seed";
import type { DocumentRecord, DocumentShare, StoreData, User } from "./types";

type DocumentUpdate = {
  title?: string;
  contentJson?: unknown;
  contentHtml?: string;
};

type ImportDocumentInput = {
  userId: string;
  fileName: string;
  content: string;
};

export type AppStore = {
  getUsers(): Promise<User[]>;
  listDocuments(userId: string): Promise<ReturnType<typeof getVisibleDocuments>>;
  getDocument(id: string, userId: string): Promise<DocumentRecord | null>;
  createDocument(userId: string, title?: string): Promise<DocumentRecord>;
  importDocument(input: ImportDocumentInput): Promise<DocumentRecord>;
  updateDocument(id: string, userId: string, update: DocumentUpdate): Promise<DocumentRecord>;
  shareDocument(id: string, ownerId: string, targetUserId: string): Promise<DocumentShare>;
  getSharesForDocument(id: string, userId: string): Promise<DocumentShare[]>;
};

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");
let memoryStore: StoreData | null = null;
let fileStoreUnavailable = false;

export function getStore(): AppStore {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    return new SupabaseStore(supabase);
  }

  return new FileStore();
}

class FileStore implements AppStore {
  async getUsers() {
    const store = await readStore();
    return store.users;
  }

  async listDocuments(userId: string) {
    const store = await readStore();
    return getVisibleDocuments(store.documents, store.shares, store.users, userId);
  }

  async getDocument(id: string, userId: string) {
    const store = await readStore();
    const document = store.documents.find((item) => item.id === id);

    if (!document || !canAccessDocument(document, store.shares, userId)) {
      return null;
    }

    return document;
  }

  async createDocument(userId: string, title = "Untitled document") {
    const store = await readStore();
    assertKnownUser(store.users, userId);

    const timestamp = nowIso();
    const document: DocumentRecord = {
      id: crypto.randomUUID(),
      title,
      contentJson: EMPTY_DOC_CONTENT,
      contentHtml: "<p>Start writing your document here.</p>",
      ownerId: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.documents.push(document);
    await writeStore(store);
    return document;
  }

  async importDocument(input: ImportDocumentInput) {
    const store = await readStore();
    assertKnownUser(store.users, input.userId);

    const timestamp = nowIso();
    const cleanTitle = input.fileName.replace(/\.(txt|md)$/i, "") || "Imported document";
    const document: DocumentRecord = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      contentJson: plainTextToTipTapDoc(input.content),
      contentHtml: plainTextToHtml(input.content),
      ownerId: input.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.documents.push(document);
    await writeStore(store);
    return document;
  }

  async updateDocument(id: string, userId: string, update: DocumentUpdate) {
    const store = await readStore();
    const index = store.documents.findIndex((item) => item.id === id);
    const existing = store.documents[index];

    if (!existing || !canAccessDocument(existing, store.shares, userId)) {
      throw new StoreError("Document not found or access denied.", 404);
    }

    if (update.title && !canManageDocument(existing, userId)) {
      throw new StoreError("Only the owner can rename this document.", 403);
    }

    const next: DocumentRecord = {
      ...existing,
      title: update.title?.trim() || existing.title,
      contentJson: update.contentJson ?? existing.contentJson,
      contentHtml: update.contentHtml ?? existing.contentHtml,
      updatedAt: nowIso(),
    };

    store.documents[index] = next;
    await writeStore(store);
    return next;
  }

  async shareDocument(id: string, ownerId: string, targetUserId: string) {
    const store = await readStore();
    const document = store.documents.find((item) => item.id === id);

    if (!document || !canManageDocument(document, ownerId)) {
      throw new StoreError("Only the owner can share this document.", 403);
    }

    assertKnownUser(store.users, targetUserId);

    if (targetUserId === ownerId) {
      throw new StoreError("Document is already owned by this user.", 400);
    }

    const existing = store.shares.find((share) => share.documentId === id && share.userId === targetUserId);
    if (existing) {
      return existing;
    }

    const share: DocumentShare = {
      id: crypto.randomUUID(),
      documentId: id,
      userId: targetUserId,
      createdAt: nowIso(),
    };

    store.shares.push(share);
    await writeStore(store);
    return share;
  }

  async getSharesForDocument(id: string, userId: string) {
    const store = await readStore();
    const document = store.documents.find((item) => item.id === id);

    if (!document || !canManageDocument(document, userId)) {
      return [];
    }

    return store.shares.filter((share) => share.documentId === id);
  }
}

class SupabaseStore implements AppStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUsers() {
    const { data, error } = await this.supabase.from("users").select("*").order("name");
    if (error) throw new StoreError(error.message, 500);
    return (data ?? []).map(mapUser);
  }

  async listDocuments(userId: string) {
    const [users, documents, shares] = await Promise.all([this.getUsers(), this.getAllDocuments(), this.getAllShares()]);
    return getVisibleDocuments(documents, shares, users.length ? users : DEMO_USERS, userId);
  }

  async getDocument(id: string, userId: string) {
    const [document, shares] = await Promise.all([this.getDocumentById(id), this.getAllShares()]);
    if (!document || !canAccessDocument(document, shares, userId)) return null;
    return document;
  }

  async createDocument(userId: string, title = "Untitled document") {
    const timestamp = nowIso();
    const payload = {
      id: crypto.randomUUID(),
      title,
      content_json: EMPTY_DOC_CONTENT,
      content_html: "<p>Start writing your document here.</p>",
      owner_id: userId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { data, error } = await this.supabase.from("documents").insert(payload).select("*").single();
    if (error) throw new StoreError(error.message, 500);
    return mapDocument(data);
  }

  async importDocument(input: ImportDocumentInput) {
    const timestamp = nowIso();
    const payload = {
      id: crypto.randomUUID(),
      title: input.fileName.replace(/\.(txt|md)$/i, "") || "Imported document",
      content_json: plainTextToTipTapDoc(input.content),
      content_html: plainTextToHtml(input.content),
      owner_id: input.userId,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { data, error } = await this.supabase.from("documents").insert(payload).select("*").single();
    if (error) throw new StoreError(error.message, 500);
    return mapDocument(data);
  }

  async updateDocument(id: string, userId: string, update: DocumentUpdate) {
    const [existing, shares] = await Promise.all([this.getDocumentById(id), this.getAllShares()]);

    if (!existing || !canAccessDocument(existing, shares, userId)) {
      throw new StoreError("Document not found or access denied.", 404);
    }

    if (update.title && !canManageDocument(existing, userId)) {
      throw new StoreError("Only the owner can rename this document.", 403);
    }

    const payload = {
      title: update.title?.trim() || existing.title,
      content_json: update.contentJson ?? existing.contentJson,
      content_html: update.contentHtml ?? existing.contentHtml,
      updated_at: nowIso(),
    };

    const { data, error } = await this.supabase.from("documents").update(payload).eq("id", id).select("*").single();
    if (error) throw new StoreError(error.message, 500);
    return mapDocument(data);
  }

  async shareDocument(id: string, ownerId: string, targetUserId: string) {
    const document = await this.getDocumentById(id);
    if (!document || !canManageDocument(document, ownerId)) {
      throw new StoreError("Only the owner can share this document.", 403);
    }

    if (targetUserId === ownerId) {
      throw new StoreError("Document is already owned by this user.", 400);
    }

    const existing = await this.getShare(id, targetUserId);
    if (existing) return existing;

    const { data, error } = await this.supabase
      .from("document_shares")
      .insert({
        id: crypto.randomUUID(),
        document_id: id,
        user_id: targetUserId,
        created_at: nowIso(),
      })
      .select("*")
      .single();

    if (error) throw new StoreError(error.message, 500);
    return mapShare(data);
  }

  async getSharesForDocument(id: string, userId: string) {
    const document = await this.getDocumentById(id);
    if (!document || !canManageDocument(document, userId)) return [];

    const { data, error } = await this.supabase.from("document_shares").select("*").eq("document_id", id);
    if (error) throw new StoreError(error.message, 500);
    return (data ?? []).map(mapShare);
  }

  private async getDocumentById(id: string) {
    const { data, error } = await this.supabase.from("documents").select("*").eq("id", id).maybeSingle();
    if (error) throw new StoreError(error.message, 500);
    return data ? mapDocument(data) : null;
  }

  private async getShare(documentId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("document_shares")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new StoreError(error.message, 500);
    return data ? mapShare(data) : null;
  }

  private async getAllDocuments() {
    const { data, error } = await this.supabase.from("documents").select("*");
    if (error) throw new StoreError(error.message, 500);
    return (data ?? []).map(mapDocument);
  }

  private async getAllShares() {
    const { data, error } = await this.supabase.from("document_shares").select("*");
    if (error) throw new StoreError(error.message, 500);
    return (data ?? []).map(mapShare);
  }
}

export class StoreError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

function assertKnownUser(users: User[], userId: string) {
  if (!users.some((user) => user.id === userId)) {
    throw new StoreError("Unknown demo user.", 400);
  }
}

async function readStore(): Promise<StoreData> {
  if (fileStoreUnavailable) {
    memoryStore = memoryStore ?? createInitialStore();
    return cloneStore(memoryStore);
  }

  try {
    const raw = await readFile(storePath, "utf-8");
    return JSON.parse(raw) as StoreData;
  } catch {
    const initial = createInitialStore();
    await writeStore(initial);
    return initial;
  }
}

async function writeStore(store: StoreData) {
  if (fileStoreUnavailable) {
    memoryStore = cloneStore(store);
    return;
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf-8");
  } catch {
    fileStoreUnavailable = true;
    memoryStore = cloneStore(store);
  }
}

function cloneStore(store: StoreData): StoreData {
  return JSON.parse(JSON.stringify(store)) as StoreData;
}

function mapUser(row: Record<string, string>): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  };
}

function mapDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    contentJson: row.content_json,
    contentHtml: String(row.content_html ?? ""),
    ownerId: String(row.owner_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapShare(row: Record<string, unknown>): DocumentShare {
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    userId: String(row.user_id),
    createdAt: String(row.created_at),
  };
}
