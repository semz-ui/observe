import { ClickEvent } from '../entities/click-event.entity';

export const CLICK_EVENT_REPOSITORY = Symbol('ClickEventRepository');

export interface ClickEventRepository {
  saveMany(events: ClickEvent[]): Promise<void>;
}
