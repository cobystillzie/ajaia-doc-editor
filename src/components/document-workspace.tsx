"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlertCircle,
  Bold,
  Check,
  FileText,
  Heading1,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Share2,
  Upload,
  Underline as UnderlineIcon,
  Users,
} from "lucide-react";
import clsx from "clsx";
import type { DocumentRecord, DocumentShare, DocumentSummary, User, VisibleDocuments } from "@/lib/types";
import { EMPTY_DOC_CONTENT } from "@/lib/seed";

type ListResponse = {
  users: User[];
  documents: VisibleDocuments;
};

type Status = {
  tone: "idle" | "success" | "error" | "loading";
  message: string;
};

const defaultDocuments: VisibleDocuments = {
  owned: [],
  shared: [],
};

export function DocumentWorkspace() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState("coby");
  const [documents, setDocuments] = useState<VisibleDocuments>(defaultDocuments);
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "Ready" });
  const [shareTarget, setShareTarget] = useState("alex");
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [toolbarTick, setToolbarTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDocumentIdRef = useRef<string | null>(null);

  const activeUser = users.find((user) => user.id === currentUserId);
  const isOwner = Boolean(activeDocument && activeDocument.ownerId === currentUserId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Write the document here...",
      }),
    ],
    content: EMPTY_DOC_CONTENT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[460px] rounded-b-md bg-white px-10 py-8 text-[16px] leading-7 text-slate-900 outline-none",
      },
    },
    onUpdate: () => setToolbarTick((value) => value + 1),
    onSelectionUpdate: () => setToolbarTick((value) => value + 1),
  });

  const loadDocuments = useCallback(
    async (preferredDocumentId?: string) => {
      setStatus({ tone: "loading", message: "Loading workspace..." });
      const response = await fetch(`/api/documents?userId=${encodeURIComponent(currentUserId)}`);
      const payload = (await response.json()) as ListResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Could not load documents.");
      }

      if ("error" in payload) {
        throw new Error(payload.error);
      }

      const nextUsers = payload.users;
      const nextDocuments = payload.documents;
      const visibleDocuments = [...nextDocuments.owned, ...nextDocuments.shared];
      const nextActive =
        visibleDocuments.find((document) => document.id === preferredDocumentId) ??
        visibleDocuments.find((document) => document.id === activeDocumentIdRef.current) ??
        visibleDocuments[0] ??
        null;

      setUsers(nextUsers);
      setDocuments(nextDocuments);
      setActiveDocument(nextActive);
      setTitle(nextActive?.title ?? "");
      setStatus({ tone: "idle", message: nextActive ? "Ready" : "Create a document to begin." });
    },
    [currentUserId],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadDocuments()).catch((error: Error) => {
      setStatus({ tone: "error", message: error.message });
    });
  }, [loadDocuments]);

  useEffect(() => {
    activeDocumentIdRef.current = activeDocument?.id ?? null;
  }, [activeDocument?.id]);

  useEffect(() => {
    if (!editor || !activeDocument) return;
    editor.commands.setContent(activeDocument.contentJson as JSONContent, { emitUpdate: false });
  }, [activeDocument, editor]);

  async function createDocument() {
    try {
      setStatus({ tone: "loading", message: "Creating document..." });
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, title: "Untitled document" }),
      });
      const payload = (await response.json()) as { document: DocumentRecord } | { error: string };

      if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not create document.");
      await loadDocuments("document" in payload ? payload.document.id : undefined);
      setStatus({ tone: "success", message: "New document created." });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not create document." });
    }
  }

  async function openDocument(document: DocumentSummary) {
    try {
      setStatus({ tone: "loading", message: "Opening document..." });
      const response = await fetch(`/api/documents/${document.id}?userId=${encodeURIComponent(currentUserId)}`);
      const payload = (await response.json()) as { document: DocumentRecord } | { error: string };
      if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not open document.");

      if ("document" in payload) {
        setActiveDocument(payload.document);
        setTitle(payload.document.title);
        setStatus({ tone: "idle", message: document.access === "shared" ? "Opened shared document." : "Ready" });
      }
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not open document." });
    }
  }

  async function saveDocument() {
    if (!editor || !activeDocument) return;

    try {
      setStatus({ tone: "loading", message: "Saving document..." });
      const response = await fetch(`/api/documents/${activeDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          title: isOwner ? title : undefined,
          contentJson: editor.getJSON(),
          contentHtml: editor.getHTML(),
        }),
      });
      const payload = (await response.json()) as { document: DocumentRecord } | { error: string };
      if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not save document.");

      if ("document" in payload) {
        setActiveDocument(payload.document);
        setTitle(payload.document.title);
        await loadDocuments(payload.document.id);
      }
      setStatus({ tone: "success", message: "Saved. Refresh and reopen to verify persistence." });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not save document." });
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".txt") && !lowerName.endsWith(".md")) {
      setStatus({ tone: "error", message: "Upload supports .txt and .md files only." });
      return;
    }

    try {
      setStatus({ tone: "loading", message: `Importing ${file.name}...` });
      const content = await file.text();
      const response = await fetch("/api/documents/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, fileName: file.name, content }),
      });
      const payload = (await response.json()) as { document: DocumentRecord } | { error: string };
      if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not import file.");

      await loadDocuments("document" in payload ? payload.document.id : undefined);
      setStatus({ tone: "success", message: `${file.name} imported as an editable document.` });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not import file." });
    }
  }

  async function openSharePanel() {
    if (!activeDocument) return;
    setIsSharePanelOpen(true);
    setShareTarget(users.find((user) => user.id !== currentUserId)?.id ?? "");

    try {
      const response = await fetch(`/api/documents/${activeDocument.id}/share?userId=${encodeURIComponent(currentUserId)}`);
      const payload = (await response.json()) as { shares: DocumentShare[] } | { error: string };
      if (response.ok && "shares" in payload) setShares(payload.shares);
    } catch {
      setShares([]);
    }
  }

  async function shareDocument() {
    if (!activeDocument || !shareTarget) return;

    try {
      setStatus({ tone: "loading", message: "Sharing document..." });
      const response = await fetch(`/api/documents/${activeDocument.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: currentUserId, targetUserId: shareTarget }),
      });
      const payload = (await response.json()) as { share: DocumentShare } | { error: string };
      if (!response.ok) throw new Error("error" in payload ? payload.error : "Could not share document.");

      if ("share" in payload) setShares((current) => [...current.filter((share) => share.id !== payload.share.id), payload.share]);
      await loadDocuments(activeDocument.id);
      setStatus({ tone: "success", message: "Document shared. Switch users to verify the shared list." });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "Could not share document." });
    }
  }

  const shareableUsers = useMemo(
    () => users.filter((user) => user.id !== activeDocument?.ownerId),
    [activeDocument?.ownerId, users],
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-slate-200 bg-white/90 px-5 py-5 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Ajaia Docs</h1>
              <p className="text-xs text-slate-500">Lightweight collaborative editor</p>
            </div>
          </div>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Current demo user</label>
          <select
            className="mb-4 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-950"
            value={currentUserId}
            onChange={(event) => {
              setCurrentUserId(event.target.value);
              setIsSharePanelOpen(false);
            }}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800" onClick={createDocument}>
              <Plus size={16} />
              New
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium transition hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} />
              Upload
            </button>
            <input ref={fileInputRef} className="hidden" type="file" accept=".txt,.md" onChange={importFile} />
          </div>

          <p className="mb-6 rounded-md bg-slate-100 px-3 py-2 text-xs leading-5 text-slate-600">
            Upload supports .txt and .md. Files become editable documents owned by the selected demo user.
          </p>

          <DocumentList title="Owned by me" documents={documents.owned} activeId={activeDocument?.id} onOpen={openDocument} />
          <DocumentList title="Shared with me" documents={documents.shared} activeId={activeDocument?.id} onOpen={openDocument} />
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Users size={14} />
                  {activeUser?.name ?? "Demo user"}
                  {activeDocument ? <span className="font-normal normal-case text-slate-400">/ {isOwner ? "Owner" : "Shared access"}</span> : null}
                </p>
                <input
                  className="w-full rounded-md border border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight outline-none transition focus:border-slate-300 focus:bg-white focus:px-3"
                  value={title}
                  disabled={!activeDocument || !isOwner}
                  onChange={(event) => setTitle(event.target.value)}
                  aria-label="Document title"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={status} />
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!activeDocument || !isOwner}
                  onClick={openSharePanel}
                >
                  <Share2 size={16} />
                  Share
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!activeDocument}
                  onClick={saveDocument}
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto px-4 py-5 lg:px-8">
            {activeDocument && editor ? (
              <div className="mx-auto max-w-5xl">
                <Toolbar editor={editor} tick={toolbarTick} />
                <EditorContent editor={editor} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" />

                {isSharePanelOpen && (
                  <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold">Share document</h2>
                        <p className="text-sm text-slate-500">Grant another seeded demo user access to this document.</p>
                      </div>
                      <button className="text-sm font-medium text-slate-500 hover:text-slate-950" onClick={() => setIsSharePanelOpen(false)}>
                        Close
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
                        value={shareTarget}
                        onChange={(event) => setShareTarget(event.target.value)}
                      >
                        {shareableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800" onClick={shareDocument}>
                        <Share2 size={16} />
                        Grant access
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Current shares:{" "}
                      {shares.length
                        ? shares
                            .map((share) => users.find((user) => user.id === share.userId)?.email ?? share.userId)
                            .join(", ")
                        : "No additional users yet."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto mt-20 flex max-w-xl flex-col items-center rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
                <FileText className="mb-4 text-slate-400" size={42} />
                <h2 className="text-xl font-semibold">No document selected</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create a document or import a .txt/.md file to begin. The demo uses seeded users so reviewers can test sharing without account setup.
                </p>
                <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800" onClick={createDocument}>
                  <Plus size={16} />
                  Create first document
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DocumentList({
  title,
  documents,
  activeId,
  onOpen,
}: {
  title: string;
  documents: DocumentSummary[];
  activeId?: string;
  onOpen: (document: DocumentSummary) => void;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="space-y-2">
        {documents.length ? (
          documents.map((document) => (
            <button
              key={`${document.access}-${document.id}`}
              className={clsx(
                "w-full rounded-md border px-3 py-3 text-left transition",
                activeId === document.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
              onClick={() => onOpen(document)}
            >
              <span className="block truncate text-sm font-medium">{document.title}</span>
              <span className={clsx("mt-1 block truncate text-xs", activeId === document.id ? "text-slate-300" : "text-slate-500")}>
                {document.access === "owned" ? "Owner: you" : `Owner: ${document.ownerName}`}
              </span>
            </button>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">No documents in this section.</p>
        )}
      </div>
    </section>
  );
}

function Toolbar({ editor, tick }: { editor: NonNullable<ReturnType<typeof useEditor>>; tick: number }) {
  void tick;
  const controls = [
    {
      label: "Bold",
      icon: Bold,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      active: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Heading",
      icon: Heading1,
      active: editor.isActive("heading", { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Bullet list",
      icon: List,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-slate-200 bg-slate-50 px-3 py-2">
      {controls.map((control) => {
        const Icon = control.icon;
        return (
          <button
            key={control.label}
            className={clsx(
              "inline-flex h-9 w-9 items-center justify-center rounded-md transition",
              control.active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950",
            )}
            onClick={control.action}
            title={control.label}
            aria-label={control.label}
            type="button"
          >
            <Icon size={17} />
          </button>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const icon =
    status.tone === "loading" ? (
      <Loader2 className="animate-spin" size={14} />
    ) : status.tone === "success" ? (
      <Check size={14} />
    ) : status.tone === "error" ? (
      <AlertCircle size={14} />
    ) : (
      <Check size={14} />
    );

  return (
    <span
      className={clsx(
        "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm",
        status.tone === "error" && "border-red-200 bg-red-50 text-red-700",
        status.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status.tone === "loading" && "border-blue-200 bg-blue-50 text-blue-700",
        status.tone === "idle" && "border-slate-200 bg-white text-slate-500",
      )}
    >
      {icon}
      {status.message}
    </span>
  );
}
