import PDFParser from "pdf2json";

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

  const parser = new PDFParser(null, true);
  const standaloneBuffer = Buffer.allocUnsafeSlow(buffer.length);
  buffer.copy(standaloneBuffer);

  return new Promise((resolve, reject) => {
    const cleanup = () => parser.destroy();

    parser.on("pdfParser_dataReady", () => {
      const text = parser.getRawTextContent();
      cleanup();
      resolve(text);
    });
    parser.on("pdfParser_dataError", () => {
      cleanup();
      reject(new Error("PDF text extraction failed."));
    });

    try {
      parser.parseBuffer(standaloneBuffer);
    } catch {
      cleanup();
      reject(new Error("PDF text extraction failed."));
    }
  });
}
