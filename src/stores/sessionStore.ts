import { makeAutoObservable } from 'mobx';

export class SessionStore {
  token: string | undefined;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isAuthenticated() {
    return this.token !== undefined;
  }

  setToken(token: string) {
    this.token = token.trim() || undefined;
  }

  clear() {
    this.token = undefined;
  }
}
