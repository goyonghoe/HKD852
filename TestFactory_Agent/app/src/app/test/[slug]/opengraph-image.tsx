import { ImageResponse } from "next/og";
import { getAllTests, getTestBySlug } from "@/lib/tests/loader";

export const alt = "심테공장 심리테스트";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTests().map((t) => ({ slug: t.meta.slug }));
}

/** Lighten a hex color by mixing with white */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `rgb(${lr},${lg},${lb})`;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = getTestBySlug(slug);

  if (!test) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6C5CE7",
          color: "white",
          fontSize: 48,
        }}
      >
        심테공장
      </div>,
      { ...size },
    );
  }

  const { meta } = test;
  const accentColor = meta.color;
  const lightColor = lighten(accentColor, 0.35);

  const fontData = await fetch(
    new URL(
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf",
    ),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(145deg, ${accentColor} 0%, ${lightColor} 100%)`,
        fontFamily: "Pretendard",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -40,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -60,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 100,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          display: "flex",
        }}
      />

      {/* Emoji container */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 40,
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        <span style={{ fontSize: 100, display: "flex" }}>{meta.emoji}</span>
      </div>

      {/* Test title */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: "white",
          display: "flex",
          textAlign: "center",
          maxWidth: 900,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          textShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        {meta.title}
      </div>

      {/* Subtitle: question count and time */}
      <div
        style={{
          fontSize: 26,
          color: "rgba(255,255,255,0.8)",
          display: "flex",
          marginTop: 16,
          gap: 16,
          alignItems: "center",
        }}
      >
        <span style={{ display: "flex" }}>{meta.questionCount}문항</span>
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
            display: "flex",
          }}
        />
        <span style={{ display: "flex" }}>약 {meta.estimatedMinutes}분</span>
      </div>

      {/* Bottom branding bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 24, display: "flex" }}>🧪</span>
        <span
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            display: "flex",
          }}
        >
          심테공장
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
