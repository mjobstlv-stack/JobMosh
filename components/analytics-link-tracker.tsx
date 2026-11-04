"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

/**
 * One delegated click listener for outbound contact links (WhatsApp, mailto, tel)
 * anywhere on the site — including server-rendered job pages — so each link
 * doesn't need its own onClick. Sends no personal data: only the link type and
 * the page it was clicked on (GA adds page_location itself).
 */
export function AnalyticsLinkTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null
      // window.open() based buttons (job card / drawer) report via trackEvent directly.
      if (!link) return
      const href = link.getAttribute("href") ?? ""

      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) {
        trackEvent("whatsapp_click", {
          link_location: link.dataset.trackLocation ?? "link",
          job_id: link.dataset.jobId,
          job_title: link.dataset.jobTitle,
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
