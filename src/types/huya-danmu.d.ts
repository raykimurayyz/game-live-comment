declare module 'huya-danmu' {
  import { EventEmitter } from 'node:events';

  export type HuyaChatMessage = {
    type: 'chat';
    time: number;
    from: {
      name: string;
      rid: string;
    };
    id: string;
    content: string;
  };

  export type HuyaGiftMessage = {
    type: 'gift';
    time: number;
    name: string;
    from: {
      name: string;
      rid: string;
    };
    id: string;
    count: number;
    price: number;
    earn: number;
  };

  export type HuyaOnlineMessage = {
    type: 'online';
    time: number;
    count: number;
  };

  export type HuyaMessage = HuyaChatMessage | HuyaGiftMessage | HuyaOnlineMessage;

  export default class HuyaDanmu extends EventEmitter {
    constructor(roomIdOrOptions: string | { roomid: string; proxy?: string });
    start(): void;
    stop(): void;
    on(event: 'connect', listener: () => void): this;
    on(event: 'message', listener: (message: HuyaMessage) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: () => void): this;
  }
}
