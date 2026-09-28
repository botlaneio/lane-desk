import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Pages set their own title, description and Open Graph; these are the shared defaults.
export const metadata: Metadata = {
  metadataBase: new URL("https://botlane.in"),
  title: "BotLane",
  description:
    "BotLane builds and operates focused software for Indian businesses, removing repetitive operational work from WhatsApp, spreadsheets and disconnected systems.",
  openGraph: { siteName: "BotLane", locale: "en_IN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link btn btn-dark btn-sm">
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
