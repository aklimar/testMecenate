import { makeAutoObservable } from 'mobx';
import type { PostsFeedTierFilter } from '../types/post';

export class FeedStore {
  tier: PostsFeedTierFilter = 'all';

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTier(tier: PostsFeedTierFilter) {
    this.tier = tier;
  }

  setTierBySegmentIndex(index: number) {
    switch (index) {
      case 0:
        this.setTier('all');
        break;
      case 1:
        this.setTier('free');
        break;
      case 2:
        this.setTier('paid');
        break;
      default:
        this.setTier('all');
    }
  }
}
