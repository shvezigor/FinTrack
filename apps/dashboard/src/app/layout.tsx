import type { Metadata } from "next";
import "@fontsource-variable/inter";
import { I18nProvider } from "../components/i18n";
import "./globals.css";

export const metadata: Metadata = {
  description: "FinTrack personal finance platform",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  title: "FinTrack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
