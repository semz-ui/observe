import type { ProjectLookup } from '../../../projects';
import { InMemoryClickEventRepository } from '../../testing/in-memory-click-event.repository';
import { InvalidApiKeyError } from '../errors/invalid-api-key.error';
import { IngestEventsUseCase } from './ingest-events.use-case';

class FakeProjectLookup implements ProjectLookup {
  constructor(private readonly keys: Map<string, string>) {}

  findProjectIdByApiKey(apiKey: string): Promise<string | null> {
    return Promise.resolve(this.keys.get(apiKey) ?? null);
  }
}

const baseEvent = {
  anonymousId: 'anon-1',
  sessionId: 'sess-1',
  url: 'http://localhost/pricing',
  elementTag: 'button',
  elementSelector: '#buy-now',
  timestamp: '2026-07-12T12:00:00.000Z',
};

describe('IngestEventsUseCase', () => {
  let repository: InMemoryClickEventRepository;
  let useCase: IngestEventsUseCase;

  beforeEach(() => {
    repository = new InMemoryClickEventRepository();
    useCase = new IngestEventsUseCase(
      new FakeProjectLookup(new Map([['obs_valid-key', 'project-1']])),
      repository,
    );
  });

  it('stamps every stored event with the project resolved from the key', async () => {
    await useCase.execute({
      apiKey: 'obs_valid-key',
      events: [baseEvent, { ...baseEvent, elementSelector: '#nav-home' }],
    });

    expect(repository.events).toHaveLength(2);
    for (const event of repository.events) {
      expect(event.projectId).toBe('project-1');
    }
  });

  it('converts ISO timestamp strings to Dates', async () => {
    await useCase.execute({ apiKey: 'obs_valid-key', events: [baseEvent] });

    expect(repository.events[0].timestamp).toEqual(
      new Date('2026-07-12T12:00:00.000Z'),
    );
  });

  it('rejects an unknown key and stores nothing', async () => {
    await expect(
      useCase.execute({ apiKey: 'obs_wrong-key', events: [baseEvent] }),
    ).rejects.toBeInstanceOf(InvalidApiKeyError);

    expect(repository.events).toHaveLength(0);
  });

  it('overrides a client-supplied projectId with the resolved one', async () => {
    await useCase.execute({
      apiKey: 'obs_valid-key',
      // simulate a hostile payload smuggling someone else's project id past
      // the DTO whitelist
      events: [
        {
          ...baseEvent,
          projectId: 'someone-elses-project',
        } as typeof baseEvent,
      ],
    });

    expect(repository.events[0].projectId).toBe('project-1');
  });
});
