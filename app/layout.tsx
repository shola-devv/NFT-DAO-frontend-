import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

export const metadata = {
  title: "DAO",
  description: "DAO for NFT holders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}