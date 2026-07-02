import type { MetadataRoute } from "next";
import { caseStudies } from "./work/case-studies";

const base = "https://santiagovittor.online"; // TODO(sv): swap to santiagovittor.com at launch

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified: new Date(), priority: 1 },
    ...caseStudies.map(({ slug }) => ({
      url: `${base}/work/${slug}`,
      lastModified: new Date(),
      priority: 0.8,
    })),
  ];
}
