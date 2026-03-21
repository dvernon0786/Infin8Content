import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Lato } from "next/font/google";
import "./globals.css";

// 🔒 REQUIRED: Startup graph validation to prevent drift
import { validateWorkflowGraph } from "@/lib/services/workflow-engine/workflow-progression";

const validation = validateWorkflowGraph();

if (!validation.valid) {
  console.error('Workflow graph validation failed:', validation.errors);
  throw new Error('Invalid workflow graph. Refusing to start.');
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infin8Content - AI-Powered Content Creation Platform",
  description: "Create content that converts without the chaos. AI-powered platform for marketing teams.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${lato.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
