import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financeiro Pro",
  description: "Controle financeiro com IA, dashboards e investimentos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
