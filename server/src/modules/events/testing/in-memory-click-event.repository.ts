import { randomUUID } from 'node:crypto';
import type { ClickEvent } from '../domain/entities/click-event.entity';
import type {
  ClickEventInput,
  ClickEventRepository,
} from '../domain/repositories/click-event.repository';

export class InMemoryClickEventRepository implements ClickEventRepository {
  readonly events: ClickEvent[] = [];

  saveMany(events: ClickEventInput[]): Promise<void> {
    this.events.push(
      ...events.map((event) => ({ id: randomUUID(), ...event })),
    );
    return Promise.resolve();
  }
}
