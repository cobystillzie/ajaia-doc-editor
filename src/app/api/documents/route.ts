import { NextRequest, NextResponse } from "next/server";
import { getStore, StoreError } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "coby";
  const store = getStore();

  try {
    const [users, documents] = await Promise.all([store.getUsers(), store.listDocuments(userId)]);
    return NextResponse.json({ users, documents });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { userId?: string; title?: string };
  const store = getStore();

  try {
    const document = await store.createDocument(body.userId ?? "coby", body.title);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof StoreError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}
