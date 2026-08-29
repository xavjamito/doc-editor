export default function DocumentLoading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="h-7 w-32 rounded-md bg-zinc-200" />
          <div className="h-8 w-44 rounded-md bg-zinc-200" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-zinc-200" />
          <div className="h-8 w-40 rounded-md bg-zinc-200" />
        </div>
        <div className="mb-4 h-8 w-2/3 rounded bg-zinc-200" />
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-3 py-2">
            <div className="h-6 w-72 rounded bg-zinc-100" />
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="h-4 w-5/6 rounded bg-zinc-100" />
            <div className="h-4 w-2/3 rounded bg-zinc-100" />
          </div>
        </div>
      </main>
    </div>
  );
}
