import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppScraper",
  description: "App Store and Google Play market intelligence — free and unlimited.",
};

/**
 * Applied before first paint: reading the stored theme in an effect would render
 * one frame in the wrong palette on every load.
 */
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
