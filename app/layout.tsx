import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { SiteFooter } from "./components/SiteFooter";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova — Prediction Markets for Nigeria",
  description:
    "Predict what happens next. Trade YES/NO on crypto, sports, politics and more — fund in naira with Roqqu.",
  openGraph: {
    title: "Nova — Prediction Markets for Nigeria",
    description:
      "Predict what happens next. Trade YES/NO on crypto, sports, politics and more — fund in naira with Roqqu.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
