import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestaurantOS — Smart Restaurant Management, POS & Kitchen Display",
  description: "Next-generation multi-tenant restaurant operating system with live tables, POS, KDS, digital menus, and billing.",
  icons: {
    icon: "/icons/restaurant-os.ico",
    shortcut: "/icons/restaurant-os.ico",
    apple: "/icons/restaurant-os.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/icons/restaurant-os.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/restaurant-os.png" />
      </head>
      <body className="min-h-full bg-[#0a0c10] text-[#e2e8f0] antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
