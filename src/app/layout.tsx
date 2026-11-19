import type { Metadata } from "next";
import {
  Barlow_Condensed,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

/** Body: Plus Jakarta Sans. Headline condensed italic: Barlow Condensed. Angka/kode: JetBrains Mono. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UMNPC Internal Contest",
  description: "Platform Internal Contest UMN Programming Club",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${barlow.variable} ${jetbrains.variable} h-dvh antialiased`}
    >
      <body className="flex h-dvh flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
