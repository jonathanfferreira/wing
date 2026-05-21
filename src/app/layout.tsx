import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const chillax = localFont({
  src: [
    { path: "../../public/fonts/chillax/Chillax-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/chillax/Chillax-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/chillax/Chillax-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/chillax/Chillax-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-chillax",
});

const steelfish = localFont({
  src: [
    { path: "../../public/fonts/steelfish/Steelfish-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/steelfish/Steelfish-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/steelfish/Steelfish-Extrabold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-steelfish",
});

export const metadata: Metadata = {
  title: "Wing | Gestão de Festivais de Dança",
  description: "Plataforma SaaS B2B2C para festivais e escolas de dança.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.variable} ${chillax.variable} ${steelfish.variable} font-sans antialiased text-gray-100 bg-black min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
