import { FeedStore } from './feedStore';
import { RealtimeStore } from './realtimeStore';
import { SessionStore } from './sessionStore';

export class RootStore {
  readonly feed = new FeedStore();
  readonly realtime = new RealtimeStore();
  readonly session = new SessionStore();
}

export const rootStore = new RootStore();
