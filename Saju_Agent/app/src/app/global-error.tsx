"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0910",
          color: "#EEEAF4",
          fontFamily:
            "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔥</div>
          <h1
            style={{
              fontSize: "24px",
              color: "#F0C674",
              marginBottom: "12px",
            }}
          >
            앗, 문제가 발생했습니다
          </h1>
          <p
            style={{
              color: "#9B95A8",
              marginBottom: "24px",
              fontSize: "15px",
            }}
          >
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              backgroundColor: "rgba(78, 205, 196, 0.1)",
              color: "#4ECDC4",
              border: "1px solid rgba(78, 205, 196, 0.2)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 500,
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
