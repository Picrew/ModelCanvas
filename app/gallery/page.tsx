import type { Metadata } from "next";
import { Gallery } from "@/src/react/Gallery";

export const metadata: Metadata = {
  title: "Component Gallery · ModelCanvas",
  description: "Renderer and controlled widget capability gallery.",
};

export default function GalleryPage() {
  return <Gallery />;
}
