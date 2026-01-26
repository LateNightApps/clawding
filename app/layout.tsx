import type { Metadata } from "next";
import Link from "next/link";
import { CrabMascot } from "@/components/CrabMascot";
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
      <body className="min-h-screen flex flex-col">
        <nav className="max-w-3xl mx-auto w-full px-6 pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <CrabMascot size={32} animated={false} />
            <span className="font-display text-lg font-bold text-gradient">
              Clawding
            </span>
          </Link>
        </nav>
        <div className="flex-1">
          {children}
        </div>
        <footer className="py-8 text-center text-muted text-sm">
          <p>
            Built with Claude{' '}
            <span className="text-coral">&#x2665;</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
