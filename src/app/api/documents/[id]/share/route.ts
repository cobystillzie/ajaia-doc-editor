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
    const shares = await getStore().getSharesForDocument(id, userId);
    return NextResponse.json({ shares });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    ownerId?: string;
    targetUserId?: string;
  };

  if (!body.targetUserId) {
    return NextResponse.json({ error: "Choose a user to share with." }, { status: 400 });
  }

  try {
    const share = await getStore().shareDocument(id, body.ownerId ?? "coby", body.targetUserId);
    return NextResponse.json({ share }, { status: 201 });
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
