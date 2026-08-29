export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="h-7 w-32 rounded-md bg-zinc-200" />
          <div className="h-8 w-44 rounded-md bg-zinc-200" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-zinc-200" />
            <div className="h-4 w-28 rounded bg-zinc-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-36 rounded-md bg-zinc-200" />
            <div className="h-9 w-32 rounded-md bg-zinc-200" />
          </div>
        </div>
        <div className="mb-3 h-4 w-24 rounded bg-zinc-200" />
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="mt-1 h-4 w-1/3 rounded bg-zinc-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
