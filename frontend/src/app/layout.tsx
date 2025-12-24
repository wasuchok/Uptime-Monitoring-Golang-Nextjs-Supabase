import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sans",
  subsets: ["latin", "thai"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "แดชบอร์ดมอนิเตอร์",
  description: "แสดงสถานะและความหน่วงของบริการแบบเรียลไทม์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${sarabun.variable} min-h-screen font-sans antialiased theme-page`}
      >
        {children}
      </body>
    </html>
  );
}
