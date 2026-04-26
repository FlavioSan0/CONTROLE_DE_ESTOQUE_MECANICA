import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../src/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Controle de Estoque",
  description: "Sistema de controle de estoque",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}