import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "운명의 도깨비 — AI 사주풀이",
    short_name: "운명의 도깨비",
    description: "생년월일만 대봐. 도깨비가 니 팔자 까발려줄게.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0910",
    theme_color: "#0A0910",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
