import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppScraper",
  description: "App Store and Google Play market intelligence — free and unlimited.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
