import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Digital Kabootar — Letters to the Martyrs of Kargil",
  description:
    "Write a letter of gratitude to a soldier who gave their life in the Kargil War.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="tricolour-bar" aria-hidden />
          <Nav />
          <main className="container">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
