import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import { NavBar } from "../components/NavBar";
import { VerifiedProvider } from "../components/VerifiedProvider";
import { LocaleProvider } from "../components/LocaleProvider";
import { ToastProvider } from "../components/ToastProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Cosmic Journey",
  description: "Cosmic exploration hub with calculators and maps"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${workSans.variable}`}>
      <body>
        <VerifiedProvider>
          <LocaleProvider>
            <ToastProvider>
              <NavBar />
              {children}
            </ToastProvider>
          </LocaleProvider>
        </VerifiedProvider>
      </body>
    </html>
  );
}
