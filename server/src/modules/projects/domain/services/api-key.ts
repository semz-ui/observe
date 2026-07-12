import { createHash, randomBytes } from 'node:crypto';

// 24 random bytes → 32-char base64url suffix; enough entropy to be
// unguessable, and base64url is safe in headers, URLs, and env vars.
export function generateApiKey(): string {
  return `obs_${randomBytes(24).toString('base64url')}`;
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
