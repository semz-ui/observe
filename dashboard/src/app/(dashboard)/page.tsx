import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h1 className="text-lg font-semibold tracking-tight">observe</h1>
      <p className="text-sm text-muted-foreground">
        The shell is here; the modules are not. Projects lands in M2 and this
        route becomes a redirect to it. Until then,{' '}
        <Link href="/debug" className="underline underline-offset-4">
          /debug
        </Link>{' '}
        proves the dashboard can reach the API.
      </p>
    </div>
  );
}
