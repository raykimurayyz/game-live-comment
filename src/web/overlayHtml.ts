export const overlayHtml = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Game Live Comment Overlay</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        background: transparent;
        color: #fff;
        overflow: hidden;
      }
      .panel {
        width: min(720px, 100vw);
        padding: 16px;
        box-sizing: border-box;
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.45);
        font-size: 13px;
        margin-bottom: 12px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f59e0b;
      }
      .connected .dot {
        background: #22c55e;
      }
      .comments {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .comment {
        max-width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.58);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        line-height: 1.35;
        word-break: break-word;
      }
      .meta {
        color: #93c5fd;
        font-weight: 700;
        margin-right: 6px;
      }
      .gift .meta {
        color: #fbbf24;
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <div id="status" class="status">
        <span class="dot"></span>
        <span id="statusText">connecting</span>
      </div>
      <section id="comments" class="comments"></section>
    </main>
    <script>
      const statusEl = document.getElementById('status');
      const statusText = document.getElementById('statusText');
      const commentsEl = document.getElementById('comments');
      const maxComments = 40;

      function connect() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(protocol + '//' + location.host + '/ws/comments');

        ws.addEventListener('open', () => {
          statusEl.classList.add('connected');
          statusText.textContent = 'connected';
        });

        ws.addEventListener('close', () => {
          statusEl.classList.remove('connected');
          statusText.textContent = 'reconnecting';
          setTimeout(connect, 1000);
        });

        ws.addEventListener('message', (event) => {
          const payload = JSON.parse(event.data);
          if (payload.event !== 'comment') {
            return;
          }
          addComment(payload.comment);
        });
      }

      function addComment(comment) {
        const el = document.createElement('div');
        el.className = 'comment ' + comment.type;
        const platform = platformLabel(comment.platform);
        el.innerHTML =
          '<span class="meta">[' +
          escapeHtml(platform) +
          '] ' +
          escapeHtml(comment.username) +
          ':</span>' +
          escapeHtml(comment.content);
        commentsEl.prepend(el);
        while (commentsEl.children.length > maxComments) {
          commentsEl.lastElementChild.remove();
        }
      }

      function platformLabel(platform) {
        if (platform === 'douyu') return '斗鱼';
        if (platform === 'huya') return '虎牙';
        if (platform === 'bilibili') return 'B站';
        return '测试';
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }

      connect();
    </script>
  </body>
</html>`;
