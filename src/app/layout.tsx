import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oh S#!T, We're Famous | PR Tracker",
  description: "Track your PR performance, media coverage, and outreach in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
