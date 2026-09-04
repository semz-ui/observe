import { z } from 'zod';

/**
 * `GET /api/projects`. There is no key field and never will be: the stored
 * value is a SHA-256 digest, useless to a client, and the plaintext is
 * unrecoverable by design (`list-projects.use-case.ts:5`).
 *
 * `createdAt` is a `Date` on the server, so it arrives as an ISO string.
 */
export const projectSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const projectListSchema = z.array(projectSummarySchema);
