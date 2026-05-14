import { NextRequest, NextResponse } from "next/server";
import { getStore, StoreError } from "@/lib/storage";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userId = request.nextUrl.searchParams.get("userId") ?? "coby";

  try {
    const document = await getStore().getDocument(id, userId);
    if (!document) {
      return NextResponse.json({ error: "Document not found or access denied." }, { status: 404 });
    }
    return NextResponse.json({ document });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    userId?: string;
    title?: string;
    contentJson?: unknown;
    contentHtml?: string;
  };

  try {
    const document = await getStore().updateDocument(id, body.userId ?? "coby", {
      title: body.title,
      contentJson: body.contentJson,
      contentHtml: body.contentHtml,
    });
    return NextResponse.json({ document });
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
