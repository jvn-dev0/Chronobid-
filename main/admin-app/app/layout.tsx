import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChronoBid | Power Admin Portal",
  description: "Restricted Power Admin Application for ChronoBid Luxury Auction Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#090c10] text-slate-100">
        {children}
      </body>
    </html>
  );
}
