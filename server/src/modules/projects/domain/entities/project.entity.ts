export interface Project {
  id: string;
  name: string;
  // SHA-256 hex digest — the plaintext key is returned once at creation and
  // never stored on the entity.
  apiKeyHash: string;
  createdAt: Date;
}
