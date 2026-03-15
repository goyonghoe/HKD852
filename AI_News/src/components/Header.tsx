export function Header({ lastUpdated }: { lastUpdated: string }) {
  const date = new Date(lastUpdated);
  const timeStr = date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
            AI
          </div>
          <h1 className="text-lg font-bold text-zinc-100">AI 뉴스 펄스</h1>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {timeStr}
        </div>
      </div>
    </header>
  );
}
