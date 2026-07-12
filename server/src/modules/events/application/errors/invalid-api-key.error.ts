// Framework-free: presentation maps this to 401 at the boundary.
export class InvalidApiKeyError extends Error {
  constructor() {
    super('invalid API key');
    this.name = 'InvalidApiKeyError';
  }
}
