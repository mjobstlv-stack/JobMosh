import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { absolute: "JobMosh · ניהול" },
  robots: { index: false, follow: false, nocache: true },
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children
}
