import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import PageTransition from "@/components/PageTransition";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudMind — AI FinOps Platform",
  description: "CloudMind helps teams monitor, analyze, and optimize cloud spend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.14),_transparent_28%),linear-gradient(180deg,_#0a0a0f_0%,_#090b14_100%)]">
          <Sidebar />
          <main className="relative min-h-screen pl-[250px]">
            <div className="min-h-screen overflow-y-auto px-6 py-6 sm:px-8 lg:px-10">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
