import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "../globals.css"

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Data Blog - Embed",
  description: "Embeddable data visualization",
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        {children}
      </body>
    </html>
  )
}
