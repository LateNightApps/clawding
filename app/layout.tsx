import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clawding - Code in Public with Claude",
  description: "Share what you're coding with Claude. One command to install, one command to post.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
