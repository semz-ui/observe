import { z } from 'zod';

/**
 * A captured click, as `GET /v1/events/recent` returns it.
 *
 * Optional fields are **absent** from the JSON rather than null — the server
 * maps its nullable columns to domain optionals before serialising
 * (`prisma-event-feed.repository.ts:27-42`), so `.optional()` is right and
 * `.nullable()` would be wrong.
 *
 * There is no `createdAt`: the API exposes the client's click time only, so
 * "how long did ingestion lag" is a question it cannot answer yet.
 */
export const clickEventSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  anonymousId: z.string(),
  sessionId: z.string(),
  url: z.string(),
  pageTitle: z.string().optional(),
  elementTag: z.string(),
  elementId: z.string().optional(),
  elementText: z.string().optional(),
  elementSelector: z.string(),
  elementHref: z.string().optional(),
  timestamp: z.iso.datetime(),
});

export type ClickEvent = z.infer<typeof clickEventSchema>;

/** Keyset page: `nextCursor` is the id to ask for next, or null at the end. */
export const recentEventsPageSchema = z.object({
  events: z.array(clickEventSchema),
  nextCursor: z.string().nullable(),
});

export type RecentEventsPage = z.infer<typeof recentEventsPageSchema>;

/** The API's own default and ceiling (`get-recent-events.dto.ts:21-27`). */
export const EVENTS_PAGE_SIZE = 50;
