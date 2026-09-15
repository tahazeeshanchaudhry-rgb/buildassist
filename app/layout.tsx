import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildAssist — AI Construction Project Assistant",
  description: "AI-powered construction project assistant for managing projects, documents, and construction knowledge.",
  icons: { icon: "/brand/app-icon.svg", apple: "/brand/app-icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
