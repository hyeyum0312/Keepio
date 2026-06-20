import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keepio",
  description: "링크를 모으고, 분류하고, 비교해 결정하는 링크 큐레이션 앱",
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
