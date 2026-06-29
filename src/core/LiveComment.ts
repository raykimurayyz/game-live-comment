export type LivePlatform = 'douyu' | 'huya' | 'bilibili' | 'mock';

export type LiveCommentType = 'chat' | 'gift' | 'system';

export type LiveComment = {
  platform: LivePlatform;
  roomId: string;
  username: string;
  content: string;
  type: LiveCommentType;
  timestamp: number;
};

export function formatLiveComment(comment: LiveComment, format: string): string {
  return format
    .replaceAll('{platform}', platformLabel(comment.platform))
    .replaceAll('{roomId}', comment.roomId)
    .replaceAll('{username}', sanitizeIrcText(comment.username))
    .replaceAll('{content}', sanitizeIrcText(comment.content))
    .replaceAll('{type}', comment.type);
}

export function platformLabel(platform: LivePlatform): string {
  switch (platform) {
    case 'douyu':
      return '斗鱼';
    case 'huya':
      return '虎牙';
    case 'bilibili':
      return 'B站';
    case 'mock':
      return '测试';
  }
}

export function sanitizeIrcText(value: string): string {
  return value.replace(/[\r\n\0]/g, ' ').trim();
}
