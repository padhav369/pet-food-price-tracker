import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: 'KibblePerPound — Compare Pet Food Prices Per Pound Across 6 Stores',
  description:
    'Compare true unit prices ($/lb) across Chewy, Amazon, Petco, PetSmart, Walmart, and Target.',
  other: {
    'impact-site-verification': 'ab0fcfbe-c0e9-444c-a332-22cf229076fa',
  },
};




export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
    <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
