import type { Metadata } from "next";
import "@fontsource/parisienne/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Atelier Atlas — A world of art",
  description:
    "A world of art, a space of your own. Discover artists in an intimate three-dimensional gallery.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
