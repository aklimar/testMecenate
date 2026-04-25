import { makeAutoObservable, runInAction } from 'mobx';
import type { ParsedWsMessage } from '../api/realtime';

type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed';

type RealtimeHandlers = {
  onMessage: (message: ParsedWsMessage) => void;
  parseMessage: (raw: string) => ParsedWsMessage;
};

export class RealtimeStore {
  status: RealtimeStatus = 'idle';
  reconnectAttempts = 0;
  lastMessageAt: number | undefined;

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private stopped = true;

  constructor() {
    makeAutoObservable<this, 'ws' | 'reconnectTimer' | 'stopped'>(
      this,
      {
        ws: false,
        reconnectTimer: false,
        stopped: false,
      },
      { autoBind: true }
    );
  }

  connect(url: string, handlers: RealtimeHandlers) {
    this.disconnect();
    this.stopped = false;
    this.open(url, handlers, false);
  }

  disconnect(nextStatus: RealtimeStatus = 'closed') {
    this.stopped = true;
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.ws?.close();
    this.ws = null;
    this.status = nextStatus;
    this.reconnectAttempts = 0;
  }

  private open(url: string, handlers: RealtimeHandlers, isReconnect: boolean) {
    this.status = isReconnect ? 'reconnecting' : 'connecting';
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      runInAction(() => {
        this.status = 'connected';
        this.reconnectAttempts = 0;
      });
    };

    this.ws.onmessage = (ev) => {
      runInAction(() => {
        this.lastMessageAt = Date.now();
      });
      handlers.onMessage(handlers.parseMessage(String(ev.data)));
    };

    this.ws.onclose = () => {
      runInAction(() => {
        this.ws = null;
        if (this.stopped) return;

        this.reconnectAttempts += 1;
        this.status = 'reconnecting';
        this.reconnectTimer = setTimeout(() => {
          this.open(url, handlers, true);
        }, 3000);
      });
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }
}
