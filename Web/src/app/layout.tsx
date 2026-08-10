import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UpdateNotification } from "@/components/UpdateNotification";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shams Al Barakat Repair Services - CRM & Automation",
  description: "Complete business management: repair jobs, customer CRM, social media automation",
  keywords: ["crm", "repair", "jobs", "quotations", "invoices", "social media"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {children}
          <UpdateNotification />
        </AuthProvider>
      </body>
    </html>
  );
}
