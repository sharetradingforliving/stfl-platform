import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AlertsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
