import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Tipografi dari style guide: Display = Barlow Condensed 800 miring,
// Heading/Body = Plus Jakarta Sans, Timer/angka = JetBrains Mono.
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: "800",
  style: "italic",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jbmono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UMNPC Internal Contest",
  description: "Platform Internal Contest UMN Programming Club",
};

export const viewport: Viewport = {
  themeColor: "#0b0f10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${barlow.variable} ${jakarta.variable} ${jbmono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
