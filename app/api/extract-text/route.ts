import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    let text = "";

    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (
      mimeType === "text/plain" ||
      fileName.endsWith(".txt")
    ) {
      text = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or TXT file." },
        { status: 415 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the file. The file may be empty or image-based." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error("[extract-text] Error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to extract text from file." },
      { status: 500 }
    );
  }
}
