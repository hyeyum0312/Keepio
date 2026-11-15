import type { Metadata } from "next";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/shared/lib/theme";
import { Providers } from "./providers";

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
    // 테마 스크립트가 data-theme을 먼저 붙이므로 서버 HTML과 다를 수 있다
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
