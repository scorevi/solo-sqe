import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Computer Lab Reservation System",
  description: "A comprehensive booking system for school computer labs with integrated SQA practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
