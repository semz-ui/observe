export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-3 px-8">
      <h1 className="text-lg font-semibold tracking-tight">observe</h1>
      <p className="text-sm text-zinc-500">
        Scaffold only — no data layer yet. M0 is done when this page fetches{' '}
        <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
          GET /health
        </code>{' '}
        from{' '}
        <code className="rounded bg-black/[.06] px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
          OBSERVE_API_URL
        </code>{' '}
        server-side and renders the status.
      </p>
    </main>
  );
}
