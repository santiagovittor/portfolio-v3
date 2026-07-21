import type { MetadataRoute } from "next";
import { caseStudies } from "./work/case-studies";

// santiagovittor.com is the services site; this portfolio lives on .online.
const base = "https://santiagovittor.online";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/interview`, lastModified: new Date(), priority: 0.8 },
    ...caseStudies.map(({ slug }) => ({
      url: `${base}/work/${slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}
