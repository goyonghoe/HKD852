import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://simtefactory.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/test/*/play", "/legal/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
