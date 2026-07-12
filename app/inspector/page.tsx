import type { Metadata } from "next";
import { ProtocolInspector } from "@/src/react/ProtocolInspector";

export const metadata: Metadata = {
  title: "Protocol Inspector · ModelCanvas",
  description: "Validate RenderEnvelope data and inspect renderer resolution.",
};

export default function InspectorPage() {
  return <ProtocolInspector />;
}
