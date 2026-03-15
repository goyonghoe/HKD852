import { ImageResponse } from "next/og";
import { getAllTests, getTestBySlug } from "@/lib/tests/loader";

export const alt = "심테공장 테스트 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTests().flatMap((test) =>
    test.results.map((result) => ({
      slug: test.meta.slug,
      resultId: result.id,
    })),
  );
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

/** Darken a hex color */
function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `rgb(${dr},${dg},${db})`;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string; resultId: string }>;
}) {
  const { slug, resultId } = await params;
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

  const result = test.results.find((r) => r.id === resultId);
  if (!result) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: test.meta.color,
          color: "white",
          fontSize: 48,
        }}
      >
        {test.meta.title}
      </div>,
      { ...size },
    );
  }

  const accentColor = test.meta.color;
  const lightColor = lighten(accentColor, 0.3);
  const darkColor = darken(accentColor, 0.2);

  const fontBoldData = await fetch(
    new URL(
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf",
    ),
  ).then((res) => res.arrayBuffer());

  const fontRegularData = await fetch(
    new URL(
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf",
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
        background: `linear-gradient(160deg, ${darkColor} 0%, ${accentColor} 40%, ${lightColor} 100%)`,
        fontFamily: "Pretendard",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -50,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: -80,
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 60,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 180,
          right: 120,
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          display: "flex",
        }}
      />

      {/* Top label: test name */}
      <div
        style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.7)",
          display: "flex",
          marginBottom: 20,
          fontWeight: 700,
        }}
      >
        {test.meta.title}
      </div>

      {/* Result emoji - large and prominent */}
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: 40,
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      >
        <span style={{ fontSize: 90, display: "flex" }}>{result.emoji}</span>
      </div>

      {/* Result title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "white",
          display: "flex",
          textAlign: "center",
          maxWidth: 950,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          textShadow: "0 2px 12px rgba(0,0,0,0.2)",
          marginBottom: 8,
        }}
      >
        {result.title}
      </div>

      {/* Result subtitle */}
      <div
        style={{
          fontSize: 28,
          color: "rgba(255,255,255,0.85)",
          display: "flex",
          textAlign: "center",
          maxWidth: 800,
          lineHeight: 1.4,
          fontWeight: 400,
        }}
      >
        {result.subtitle}
      </div>

      {/* Percentage badge (if available) */}
      {result.percentage && (
        <div
          style={{
            marginTop: 20,
            fontSize: 18,
            color: "rgba(255,255,255,0.9)",
            background: "rgba(255,255,255,0.15)",
            padding: "8px 20px",
            borderRadius: 20,
            display: "flex",
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {result.percentage}
        </div>
      )}

      {/* Bottom branding bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 22, display: "flex" }}>🧪</span>
        <span
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            display: "flex",
          }}
        >
          심테공장
        </span>
        <span
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            display: "flex",
            marginLeft: 8,
          }}
        >
          |
        </span>
        <span
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            display: "flex",
            marginLeft: 8,
          }}
        >
          나도 해보기 →
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Pretendard",
          data: fontBoldData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Pretendard",
          data: fontRegularData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
