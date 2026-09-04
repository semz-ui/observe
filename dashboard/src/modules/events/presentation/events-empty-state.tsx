export function EventsEmptyState(): React.ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm font-medium">No events yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Install the SDK with this project&apos;s API key and click something.
        Rows appear here within one poll.
      </p>
    </div>
  );
}
