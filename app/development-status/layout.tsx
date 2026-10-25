import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Development Status",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DevelopmentStatusLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
