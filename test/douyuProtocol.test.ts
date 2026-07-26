import { describe, expect, it } from 'vitest';
import {
  decodeDouyuPackets,
  encodeDouyuPayload,
  isDouyuRoomMessage,
  parseDouyuMessage,
} from '../src/platforms/douyu/douyuProtocol.js';

describe('douyuProtocol', () => {
  it('parses escaped douyu key-value messages', () => {
    expect(parseDouyuMessage('type@=chatmsg/nn@=user@Sname/txt@=hello@Aworld/')).toEqual({
      type: 'chatmsg',
      nn: 'user/name',
      txt: 'hello@world',
    });
  });

  it('decodes encoded douyu packets', () => {
    const packet = encodeDouyuPayload('type@=chatmsg/nn@=alice/txt@=hello/');

    expect(decodeDouyuPackets(packet)).toEqual([
      {
        type: 'chatmsg',
        nn: 'alice',
        txt: 'hello',
      },
    ]);
  });

  it('checks whether a douyu message belongs to the current room', () => {
    expect(isDouyuRoomMessage({ type: 'chatmsg', rid: '10942092' }, '10942092')).toBe(true);
    expect(isDouyuRoomMessage({ type: 'chatmsg', rid: '27367112' }, '10942092')).toBe(false);
    expect(isDouyuRoomMessage({ type: 'chatmsg' }, '10942092')).toBe(true);
  });
});
