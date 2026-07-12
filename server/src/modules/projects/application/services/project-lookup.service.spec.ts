import { hashApiKey } from '../../domain/services/api-key';
import { InMemoryProjectRepository } from '../../testing/in-memory-project.repository';
import { ProjectLookupService } from './project-lookup.service';

describe('ProjectLookupService', () => {
  let repository: InMemoryProjectRepository;
  let service: ProjectLookupService;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    service = new ProjectLookupService(repository);
  });

  it('resolves a plaintext key to the project id', async () => {
    const project = await repository.create({
      name: 'my site',
      apiKeyHash: hashApiKey('obs_known-key'),
    });

    await expect(service.findProjectIdByApiKey('obs_known-key')).resolves.toBe(
      project.id,
    );
  });

  it('returns null for an unknown key', async () => {
    await repository.create({
      name: 'my site',
      apiKeyHash: hashApiKey('obs_known-key'),
    });

    await expect(
      service.findProjectIdByApiKey('obs_wrong-key'),
    ).resolves.toBeNull();
  });

  it('does not match when handed an already-hashed key', async () => {
    const plaintext = 'obs_known-key';
    await repository.create({
      name: 'my site',
      apiKeyHash: hashApiKey(plaintext),
    });

    // the port hashes internally — passing the digest must NOT match,
    // otherwise a leaked hash would be as good as the key itself
    await expect(
      service.findProjectIdByApiKey(hashApiKey(plaintext)),
    ).resolves.toBeNull();
  });
});
