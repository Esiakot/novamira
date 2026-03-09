import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import NotificationToast from "@/components/NotificationToast";
import Header from "@/components/layout/Header";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "novamira",
  description: "novamira - Réseau social",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={quicksand.variable}>
        <AuthProvider>
          <Header />
          {children}
          <NotificationToast />
        </AuthProvider>
      </body>
    </html>
  );
}
