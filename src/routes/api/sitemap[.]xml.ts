import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://getcompanioncare.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.9" },
  { path: "/trust", changefreq: "monthly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/services/marketplace", changefreq: "monthly", priority: "0.85" },
  { path: "/services/partners", changefreq: "monthly", priority: "0.85" },
  { path: "/services/healthcare", changefreq: "monthly", priority: "0.85" },
  { path: "/services/companionship", changefreq: "monthly", priority: "0.8" },
  { path: "/services/personal-care", changefreq: "monthly", priority: "0.8" },
  { path: "/services/housekeeping", changefreq: "monthly", priority: "0.8" },
  { path: "/services/errands", changefreq: "monthly", priority: "0.8" },
  { path: "/services/respite-care", changefreq: "monthly", priority: "0.8" },
  { path: "/legal/independent-contractors", changefreq: "yearly", priority: "0.5" },
  { path: "/legal/scope-of-practice", changefreq: "yearly", priority: "0.6" },
  { path: "/legal/state-availability", changefreq: "monthly", priority: "0.6" },

  { path: "/for-families", changefreq: "monthly", priority: "0.8" },
  { path: "/for-caregivers", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/resources", changefreq: "weekly", priority: "0.7" },
  { path: "/resources/cost-of-in-home-care", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/signs-parent-needs-help", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/medicare-medicaid-home-care", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/fall-prevention-seniors", changefreq: "monthly", priority: "0.7" },
  { path: "/resources/companion-vs-personal-care", changefreq: "monthly", priority: "0.7" },
  { path: "/resources/aging-in-place-checklist", changefreq: "monthly", priority: "0.6" },
  { path: "/resources/how-to-choose-a-caregiver", changefreq: "monthly", priority: "0.6" },
  { path: "/resources/dementia-care-tips", changefreq: "monthly", priority: "0.6" },
  { path: "/resources/respite-care-guide", changefreq: "monthly", priority: "0.8" },
  { path: "/resources/hospital-to-home-transition", changefreq: "monthly", priority: "0.8" },
  { path: "/resources/caregiver-burnout", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/how-to-talk-to-parent-about-care", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/live-in-vs-24-hour-care", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/memory-care-at-home-vs-facility", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/medication-management-seniors", changefreq: "monthly", priority: "0.8" },
  { path: "/resources/bathing-help-seniors", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/long-distance-caregiving", changefreq: "monthly", priority: "0.8" },
  { path: "/resources/paying-family-caregiver", changefreq: "monthly", priority: "0.8" },
  { path: "/resources/sundowning-strategies", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/hospice-vs-palliative-care", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/senior-nutrition-guide", changefreq: "monthly", priority: "0.75" },
  { path: "/resources/home-health-vs-home-care", changefreq: "monthly", priority: "0.8" },


  { path: "/auth", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries.map(
          (e) =>
            `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
