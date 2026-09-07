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

/**
 * Mirrors `CreateProjectDto` on the server: trimmed first, so a whitespace-only
 * name fails as empty rather than passing as three spaces.
 */
export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Give the project a name')
  .max(100, 'Keep the name to 100 characters or fewer');

/**
 * `POST /api/projects`. `apiKey` is the plaintext `obs_…` key, and this response
 * is the only place it will ever exist: storage keeps a SHA-256 digest, so the
 * key cannot be recovered — not by an admin, not by the database owner. The list
 * endpoint does not return the field at all.
 */
export const createdProjectSchema = projectSummarySchema.extend({
  apiKey: z.string(),
});

export type CreatedProject = z.infer<typeof createdProjectSchema>;
