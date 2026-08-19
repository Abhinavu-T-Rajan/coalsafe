import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COALSAFE - Development Environment",
  description: "Mine Safety & Incident Prevention Platform (SIH1645)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
