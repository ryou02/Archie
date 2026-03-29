import type { Metadata } from "next";
import "./globals.css";
import {
  accentFont,
  bodyFont,
  displayFont,
  monoFont,
} from "@/app/fonts";

export const metadata: Metadata = {
  title: "Archie",
  description: "Build Roblox games by talking to Archie",
  icons: {
    icon: "/logo-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} ${accentFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
