export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
            <div className="w-24 h-5 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="w-20 h-4 rounded bg-zinc-800 animate-pulse" />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* Brief skeleton */}
        <div className="mt-4 mb-6 rounded-2xl border border-zinc-800/50 bg-zinc-900 p-4">
          <div className="w-24 h-4 rounded bg-zinc-800 animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="w-full h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="w-5/6 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="w-4/6 h-3 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-5 rounded-full bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Category pills skeleton */}
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-20 h-7 rounded-full bg-zinc-800 animate-pulse"
            />
          ))}
        </div>

        {/* Card skeletons */}
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-zinc-900/60 border border-zinc-800/50 p-4"
            >
              <div className="flex gap-2 mb-2">
                <div className="w-20 h-5 rounded-full bg-zinc-800 animate-pulse" />
                <div className="w-16 h-5 rounded-full bg-zinc-800 animate-pulse" />
              </div>
              <div className="w-full h-4 rounded bg-zinc-800 animate-pulse mb-1.5" />
              <div className="w-3/4 h-4 rounded bg-zinc-800 animate-pulse mb-1.5" />
              <div className="w-5/6 h-3 rounded bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
