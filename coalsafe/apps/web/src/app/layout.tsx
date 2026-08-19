import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COALSAFE — Mine Safety & Operations",
  description: "Digital Mine Operations, Shift Handover & Safety Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
