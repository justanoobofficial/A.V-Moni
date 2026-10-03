import type { Metadata } from "next";
import "./globals.css";
import { TerminalProvider } from "@/context/TerminalContext";
import TerminalShell from "@/components/TerminalShell";

export const metadata: Metadata = {
  title: "A.V MONI — Art Deco Arbitrage & +EV Syndicate Terminal",
  description:
    "Advanced Sports Betting Arbitrage (Surebetting), Value Betting (+EV Kelly Criterion), Bankroll Management System, and Gemini API Key Pooling/Rotation Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&family=Marcellus&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0A] text-[#F2F0E4] antialiased selection:bg-[#D4AF37] selection:text-[#0A0A0A]">
        <TerminalProvider>
          <TerminalShell>{children}</TerminalShell>
        </TerminalProvider>
      </body>
    </html>
  );
}
