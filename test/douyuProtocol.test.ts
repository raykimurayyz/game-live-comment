import { describe, expect, it } from 'vitest';
import { decodeDouyuPackets, encodeDouyuPayload, parseDouyuMessage } from '../src/platforms/douyu/douyuProtocol.js';

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
});
