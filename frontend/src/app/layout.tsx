import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archie — AI Game Builder",
  description: "Build Roblox games by talking to Archie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
