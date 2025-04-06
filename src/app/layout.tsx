import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/context/LanguageContext";
import { ToastProvider } from '@/lib/context/ToastContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "İngilizce Pratik Platformu",
  description: "İngilizce konuşma pratiği yapmak için platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <LanguageProvider>
        <ToastProvider>
          <body className={inter.className}>
            {children}
          </body>
        </ToastProvider>
      </LanguageProvider>
    </html>
  );
}
