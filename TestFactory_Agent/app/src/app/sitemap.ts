import type { MetadataRoute } from "next";
import { getAllTests } from "@/lib/tests/loader";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://simtefactory.com";
  const tests = getAllTests();
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  for (const test of tests) {
    entries.push({
      url: `${baseUrl}/test/${test.meta.slug}`,
      lastModified: new Date(test.meta.createdAt),
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (const result of test.results) {
      entries.push({
        url: `${baseUrl}/test/${test.meta.slug}/result/${result.id}`,
        lastModified: new Date(test.meta.createdAt),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
