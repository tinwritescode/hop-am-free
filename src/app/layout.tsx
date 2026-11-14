import type { Metadata } from "next";
import { Lora, Nunito } from "next/font/google";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "vietnamese"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "vietnamese"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Hợp Âm Free – hợp âm guitar, thế tay ngay bên cạnh", template: "%s | Hợp Âm Free" },
  description: "Tra hợp âm guitar miễn phí: lời và thế bấm trên cùng một màn hình, có Mầm dẫn bài, soát lỗi và gợi ý hợp âm dễ đánh.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${nunito.variable} ${lora.variable} font-sans antialiased`}>
        <AuthKitProvider>{children}</AuthKitProvider>
      </body>
    </html>
  );
}
