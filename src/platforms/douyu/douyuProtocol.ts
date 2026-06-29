const DOUYU_CLIENT_MESSAGE_TYPE = 689;

export type DouyuMessage = Record<string, string>;

export function encodeDouyuPayload(payload: string): Buffer {
  const body = Buffer.from(`${payload}\0`, 'utf8');
  const packetLength = body.length + 8;
  const packet = Buffer.alloc(packetLength + 4);

  packet.writeInt32LE(packetLength, 0);
  packet.writeInt32LE(packetLength, 4);
  packet.writeInt16LE(DOUYU_CLIENT_MESSAGE_TYPE, 8);
  packet.writeInt16LE(0, 10);
  body.copy(packet, 12);

  return packet;
}

export function createLoginRequest(roomId: string): Buffer {
  return encodeDouyuPayload(`type@=loginreq/roomid@=${roomId}/`);
}

export function createJoinGroupRequest(roomId: string): Buffer {
  return encodeDouyuPayload(`type@=joingroup/rid@=${roomId}/gid@=-9999/`);
}

export function createHeartbeatRequest(): Buffer {
  return encodeDouyuPayload('type@=mrkl/');
}

export function decodeDouyuPackets(data: Buffer): DouyuMessage[] {
  const messages: DouyuMessage[] = [];
  let offset = 0;

  while (offset + 12 <= data.length) {
    const packetLength = data.readInt32LE(offset);
    const fullLength = packetLength + 4;

    if (packetLength <= 8 || offset + fullLength > data.length) {
      break;
    }

    const bodyStart = offset + 12;
    const bodyEnd = offset + fullLength;
    const body = data.subarray(bodyStart, bodyEnd).toString('utf8').replace(/\0+$/g, '');

    for (const rawMessage of body.split('\0').filter(Boolean)) {
      const parsed = parseDouyuMessage(rawMessage);
      if (parsed.type) {
        messages.push(parsed);
      }
    }

    offset += fullLength;
  }

  if (messages.length === 0) {
    const text = data.toString('utf8');
    for (const rawMessage of text.split('\0').filter(Boolean)) {
      const parsed = parseDouyuMessage(rawMessage);
      if (parsed.type) {
        messages.push(parsed);
      }
    }
  }

  return messages;
}

export function parseDouyuMessage(rawMessage: string): DouyuMessage {
  const result: DouyuMessage = {};

  for (const segment of rawMessage.split('/')) {
    if (!segment) {
      continue;
    }

    const separatorIndex = segment.indexOf('@=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = segment.slice(0, separatorIndex);
    const value = segment.slice(separatorIndex + 2);
    result[unescapeDouyuValue(key)] = unescapeDouyuValue(value);
  }

  return result;
}

export function unescapeDouyuValue(value: string): string {
  return value.replaceAll('@S', '/').replaceAll('@A', '@');
}
