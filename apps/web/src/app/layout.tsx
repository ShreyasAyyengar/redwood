import type { Metadata } from "next";
import localFont from "next/font/local";
import "@redwood/shad-ui/globals.css";
import { Suspense } from "react";
import { env } from "../env";
import ActionMenu from "./_components/action-menu";
import AuthLayer from "./_components/auth-layer";
import NavigatorCommand from "./_components/navigate/navigator-command";
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
  title: env.NEXT_PUBLIC_NODE_ENV === "development" ? "DEV — Redwood" : "Redwood",
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
        <Suspense fallback={null}>
          <AuthLayer />
        </Suspense>
        <head>{reactScanEnabled && <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />}</head>
        <body className={`${geistSans.variable} ${geistMono.variable} dark`}>
          <div className="fixed bottom-4 left-4 z-50 lg:hidden">
            <NavigatorCommand />
          </div>

          <ActionMenu />
          {children}
        </body>
      </Providers>
    </html>
  );
}
