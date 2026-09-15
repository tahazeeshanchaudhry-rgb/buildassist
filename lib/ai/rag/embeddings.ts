import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const GEMINI_EMBEDDING_DIMENSIONS = 3072;

export const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
});
