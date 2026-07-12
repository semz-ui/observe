import { ClickEvent } from '../entities/click-event.entity';

export const CLICK_EVENT_REPOSITORY = Symbol('ClickEventRepository');

// id is filled in by the persistence layer (uuid v7 default).
export type ClickEventInput = Omit<ClickEvent, 'id'>;

export interface ClickEventRepository {
  saveMany(events: ClickEventInput[]): Promise<void>;
}
