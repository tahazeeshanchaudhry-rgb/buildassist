import { createRequire } from "node:module";

const nodeRequire = createRequire(`${process.cwd()}/package.json`);
const { PDFParse } = nodeRequire("pdf-parse") as typeof import("pdf-parse");

export type SupportedDocumentType = "pdf" | "txt";

export function getSupportedDocumentType(name: string, mimeType: string): SupportedDocumentType | null {
  const extension = name.toLowerCase().split(".").pop();

  if (extension === "pdf" || mimeType === "application/pdf") return "pdf";
  if (extension === "txt" || mimeType === "text/plain") return "txt";
  return null;
}

export async function extractDocumentText(buffer: Buffer, type: SupportedDocumentType): Promise<string> {
  if (type === "txt") {
    return new TextDecoder().decode(buffer);
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
