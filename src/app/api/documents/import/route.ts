import { NextRequest, NextResponse } from "next/server";
import { getStore, StoreError } from "@/lib/storage";

export const dynamic = "force-dynamic";

const supportedExtensions = [".txt", ".md"];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    userId?: string;
    fileName?: string;
    content?: string;
  };

  const fileName = body.fileName?.trim() ?? "";
  const lowerFileName = fileName.toLowerCase();
  const isSupported = supportedExtensions.some((extension) => lowerFileName.endsWith(extension));

  if (!fileName || !isSupported) {
    return NextResponse.json({ error: "Upload supports .txt and .md files only." }, { status: 400 });
  }

  if (typeof body.content !== "string" || body.content.length > 200_000) {
    return NextResponse.json({ error: "File content is missing or too large for this demo." }, { status: 400 });
  }

  try {
    const document = await getStore().importDocument({
      userId: body.userId ?? "coby",
      fileName,
      content: body.content,
    });
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
