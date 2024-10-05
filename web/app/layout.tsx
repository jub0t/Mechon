import * as React from "react";

import Backbone from "./components/Backbone";
import { cn } from "@/lib/utils";

import { Sen as GlobalFont } from "next/font/google"
import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.scss";
import { Toaster } from "@/components/ui/toaster";

const master_font = GlobalFont({
  adjustFontFallback: true,
  subsets: ["latin"],
  display: "swap",
  weight: [
    "500",
    "400",
    "600",
    "700",
    "800",
  ],
})

export const metadata: Metadata = {
  title: "Mechon - Discord Bot Web Interface",
  description: "Manage your discord applications from a single web interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = cookies().get("theme")?.value == 'dark' ? "dark" : "light";

  return (
    <html lang="en" className={cn("",
      master_font.className,
    )}>
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body
        className={cn(
          `${theme} min-h-screen w-full flex flex-wrap bg-background font-sans antialiased`,
        )}
      >
        <Backbone>
          {children}
        </Backbone>
        <Toaster />
      </body>
    </html>
  );
}
