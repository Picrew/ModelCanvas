import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host =
    incoming.get("x-forwarded-host") ??
    incoming.get("host") ??
    "localhost:3000";
  const protocol =
    incoming.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "ModelCanvas · Universal render bridge";
  const description =
    "A provider-neutral protocol, renderer registry, component library and interactive playground for rich model output.";
  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: new URL("/og.png", base).toString(),
          width: 1731,
          height: 909,
          alt: "ModelCanvas universal rendering bridge",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/katex/katex.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
