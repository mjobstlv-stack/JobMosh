"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { cachedJobParams, contentGroupFor, trackEvent } from "@/lib/analytics"

/**
 * One delegated click listener for outbound contact links (WhatsApp, mailto, tel)
 * anywhere on the site — including server-rendered job pages — so each link
 * doesn't need its own onClick. Sends no personal data: only the link type and
 * the page it was clicked on (GA adds page_location itself).
 */
export function AnalyticsLinkTracker() {
  const pathname = usePathname()

  // Keep content_group in step with client-side navigations, so events fired on a page
  // (job_view, generate_lead…) carry that page's type. The first load sets it in layout.tsx.
  useEffect(() => {
    try {
      window.gtag?.("set", { content_group: contentGroupFor(pathname) })
    } catch {
      // Analytics must never break the UI.
    }
  }, [pathname])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null
      // window.open() based buttons (job card / drawer) report via trackEvent directly.
      if (!link) return
      const href = link.getAttribute("href") ?? ""

      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) {
        trackEvent("whatsapp_click", {
          job_id: link.dataset.jobId,
          job_title: link.dataset.jobTitle,
          ...cachedJobParams(link.dataset.jobId),
          link_location: link.dataset.trackLocation ?? "link",
        })
      } else if (href.startsWith("mailto:")) {
        const subject = decodeURIComponent(href.split("subject=")[1] ?? "")
        trackEvent(subject.includes("פרסום משרה") ? "employer_contact" : "contact_email", {
          method: "email",
        })
      } else if (href.startsWith("tel:")) {
        trackEvent("phone_click")
      }
    }
    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, { capture: true })
  }, [])

  return null
}
