import { hashApiKey } from '../../domain/services/api-key';
import { InMemoryProjectRepository } from '../../testing/in-memory-project.repository';
import { CreateProjectUseCase } from './create-project.use-case';

describe('CreateProjectUseCase', () => {
  let repository: InMemoryProjectRepository;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    useCase = new CreateProjectUseCase(repository);
  });

  it('returns a plaintext key with the obs_ prefix', async () => {
    const result = await useCase.execute('my site');

    expect(result.apiKey).toMatch(/^obs_/);
    expect(result.name).toBe('my site');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('stores only the sha-256 digest of the returned key', async () => {
    const result = await useCase.execute('my site');

    expect(repository.projects).toHaveLength(1);
    const stored = repository.projects[0];
    expect(stored.apiKeyHash).toBe(hashApiKey(result.apiKey));
    expect(stored.apiKeyHash).not.toBe(result.apiKey);
    expect(stored).not.toHaveProperty('apiKey');
  });

  it('supports lookup by hashing the plaintext key (the ingest path)', async () => {
    const result = await useCase.execute('my site');

    const found = await repository.findByApiKeyHash(hashApiKey(result.apiKey));
    expect(found?.id).toBe(result.id);
  });

  it('generates a distinct key per project', async () => {
    const first = await useCase.execute('site one');
    const second = await useCase.execute('site two');

    expect(first.apiKey).not.toBe(second.apiKey);
  });
});
