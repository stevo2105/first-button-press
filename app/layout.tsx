import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackgroundAudioPlayer from "./components/background-audio-player";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "First Button Wins",
  description: "Click the button first to win!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <BackgroundAudioPlayer />
      </body>
    </html>
  );
}
