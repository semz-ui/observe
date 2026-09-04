'use client';

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';

import {
  POLL_INTERVAL_MS,
  useEventsFeedViewModel,
} from '../application/use-events-feed-view-model';
import type { ClickEvent, RecentEventsPage } from '../domain/event';
import { EventDetailDialog } from './event-detail-dialog';
import { EventsEmptyState } from './events-empty-state';
import { EventsTable } from './events-table';
import { Button } from '@/shared/ui/button';

export function EventsFeed({
  projectId,
  initialPage,
}: {
  projectId: string;
  initialPage: RecentEventsPage;
}): React.ReactElement {
  const feed = useEventsFeedViewModel({ projectId, initialPage });

  // Which row's dialog is open is this component's business, the same way the
  // switcher's menu state belongs to the primitive rather than the ViewModel.
  const [inspecting, setInspecting] = useState<ClickEvent | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={feed.togglePause}>
          {feed.isPaused ? <Pause /> : <Play />}
          {feed.isPaused ? 'Paused' : 'Live'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {feed.isPaused
            ? 'Polling stopped — no requests are being made.'
            : `Polling every ${String(POLL_INTERVAL_MS / 1000)}s, and only while this tab is visible.`}
        </span>
      </div>

      {feed.errorMessage === null ? null : (
        <p className="text-sm text-destructive">{feed.errorMessage}</p>
      )}

      {feed.hasGap ? (
        <p className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          More than a page of events arrived between polls, so there is a hole
          between the newest rows and the ones below. Reload to close it — the
          cursor only walks backwards.
        </p>
      ) : null}

      {feed.isEmpty ? (
        <EventsEmptyState />
      ) : (
        <EventsTable
          rows={feed.rows}
          newIds={feed.newIds}
          onInspect={setInspecting}
        />
      )}

      {feed.canLoadMore ? (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={feed.loadMore}
            disabled={feed.isLoadingMore}
          >
            {feed.isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}

      <EventDetailDialog
        event={inspecting}
        onClose={() => {
          setInspecting(null);
        }}
      />
    </div>
  );
}
