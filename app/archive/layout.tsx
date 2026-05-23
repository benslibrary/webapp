import type { Metadata, Viewport } from "next";
import { ArchiveFontLoader } from "@/components/archive/font-loader";
import "./archive.css";

export const metadata: Metadata = {
  title: "Ben's Archive 4.0",
  description: "벤의서재",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="archive-theme archive-shell min-h-dvh">
      <ArchiveFontLoader />
      {children}
    </div>
  );
}
