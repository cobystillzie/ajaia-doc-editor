export type User = {
  id: string;
  name: string;
  email: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  contentJson: unknown;
  contentHtml: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentShare = {
  id: string;
  documentId: string;
  userId: string;
  createdAt: string;
};

export type DocumentSummary = DocumentRecord & {
  access: "owned" | "shared";
  ownerName: string;
};

export type VisibleDocuments = {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
};

export type StoreData = {
  users: User[];
  documents: DocumentRecord[];
  shares: DocumentShare[];
};
