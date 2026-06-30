import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/ToastContext";

export const metadata: Metadata = {
  title: "Parcelar - Gestão de Restaurantes",
  description: "Sistema de gestão de restaurantes com pagamento online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
