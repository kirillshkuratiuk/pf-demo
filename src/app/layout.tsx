import type { Metadata } from "next";
import PFShell from "@/components/PFShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "PredictFolio Feature Demo",
  description:
    "Feature concepts for PredictFolio — Bubble Map, Betting Calendar, Trader DNA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className="light-theme" suppressHydrationWarning style={{ backgroundColor: "#ffffff" }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="stylesheet" href="/pf-css/e17be1cad43947f6.css" />
        <link rel="stylesheet" href="/pf-css/5cd88e493d902a62.css" />
        <link rel="stylesheet" href="/pf-css/1e950adfc0cd0df8.css" />
        <link rel="stylesheet" href="/pf-css/287a377025a967f5.css" />
        <link rel="stylesheet" href="/pf-css/5dc5e8abd27f611f.css" />
      </head>
      <body>
        <PFShell>{children}</PFShell>
      </body>
    </html>
  );
}
