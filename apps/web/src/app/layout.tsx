import type { Metadata } from "next";
import localFont from "next/font/local";
import "@redwood/shad-ui/globals.css";
import { env } from "../env";
import { AuthLayer } from "./_components/auth-layer";
import Providers from "./_components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Redwood",
  description: "Redwood UCSC",
};

const reactScanEnabled = env.NEXT_PUBLIC_NODE_ENV === "development";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <AuthLayer />
        <head>{reactScanEnabled && <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />}</head>

        <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
      </Providers>
    </html>
  );
}
