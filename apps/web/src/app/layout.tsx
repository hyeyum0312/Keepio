import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keepio",
  description: "Save once. Curate freely. Share beautifully.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
