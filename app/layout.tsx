import "@/app/ui/globals.css";
import type { Metadata } from "next";
import { font } from "./ui/fonts";

export const metadata: Metadata = {
  title: {
    default: "Picunada",
    template: "%s | Picunada",
  },
  description: "Developer portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
