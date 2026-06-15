import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RageBait Editor 🔥 — Universal Code Roaster",
  description:
    "Get your code absolutely roasted by AI. Find errors, bad syntax, and wrong formatting — served with savage Gen-Z, Hinglish, and Banglish slang. No cap fr fr 💀",
  keywords: [
    "ragebait editor",
    "code review",
    "code roaster",
    "linter",
    "gen-z",
    "hinglish",
    "banglish",
    "ai code review",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased noise-bg`}
      >
        {children}
      </body>
    </html>
  );
}
