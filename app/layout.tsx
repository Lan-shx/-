import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "职场观测站 · 招聘样本研究工作台",
  description: "基于公开招聘样本的职业探索、证据查询和研究助手。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
