import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aaronlui13.github.io/LUISIR-ict-game-lab/"),
  title: "Lui Sir’s ICT Game Lab",
  description: "Short, interactive ICT missions for the classroom and beyond.",
  openGraph: {
    title: "Lui Sir’s ICT Game Lab",
    description: "Short, interactive ICT missions for the classroom and beyond.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lui Sir’s ICT Game Lab",
    description: "Short, interactive ICT missions for the classroom and beyond.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-HK">
      <body>{children}</body>
    </html>
  );
}
