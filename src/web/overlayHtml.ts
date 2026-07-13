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
        width: min(960px, 100vw);
        padding: 16px;
        box-sizing: border-box;
      }
      .controls {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
        gap: 10px;
        align-items: end;
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.58);
        backdrop-filter: blur(8px);
      }
      .field {
        min-width: 0;
      }
      .label-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 5px;
      }
      label {
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 700;
      }
      .platform-state {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 700;
        text-align: right;
      }
      .platform-state.success {
        color: #86efac;
      }
      .platform-state.error {
        color: #fca5a5;
      }
      input {
        width: 100%;
        height: 34px;
        box-sizing: border-box;
        border: 1px solid rgba(148, 163, 184, 0.45);
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.86);
        color: #fff;
        padding: 0 10px;
        outline: none;
      }
      input:focus {
        border-color: #60a5fa;
      }
      button {
        height: 34px;
        border: 0;
        border-radius: 6px;
        background: #2563eb;
        color: #fff;
        padding: 0 14px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }
      .message {
        grid-column: 1 / -1;
        min-height: 18px;
        color: #cbd5e1;
        font-size: 12px;
      }
      .message.error {
        color: #fca5a5;
      }
      .message.success {
        color: #86efac;
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
      @media (max-width: 760px) {
        .controls {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="panel">
      <form id="roomForm" class="controls">
        <div class="field">
          <div class="label-row">
            <label for="douyuRoom">斗鱼房间号</label>
            <span id="douyuState" class="platform-state"></span>
          </div>
          <input id="douyuRoom" name="douyu" autocomplete="off" placeholder="留空则停用" />
        </div>
        <div class="field">
          <div class="label-row">
            <label for="huyaRoom">虎牙房间号</label>
            <span id="huyaState" class="platform-state"></span>
          </div>
          <input id="huyaRoom" name="huya" autocomplete="off" placeholder="留空则停用" />
        </div>
        <div class="field">
          <div class="label-row">
            <label for="bilibiliRoom">B站房间号</label>
            <span id="bilibiliState" class="platform-state"></span>
          </div>
          <input id="bilibiliRoom" name="bilibili" autocomplete="off" placeholder="留空则停用" />
        </div>
        <button id="saveRooms" type="submit">更新/保存</button>
        <div id="roomMessage" class="message"></div>
      </form>
      <div id="status" class="status">
        <span class="dot"></span>
        <span id="statusText">页面连接中</span>
      </div>
      <section id="comments" class="comments"></section>
    </main>
    <script>
      const statusEl = document.getElementById('status');
      const statusText = document.getElementById('statusText');
      const commentsEl = document.getElementById('comments');
      const roomForm = document.getElementById('roomForm');
      const roomMessage = document.getElementById('roomMessage');
      const saveRooms = document.getElementById('saveRooms');
      const roomInputs = {
        douyu: document.getElementById('douyuRoom'),
        huya: document.getElementById('huyaRoom'),
        bilibili: document.getElementById('bilibiliRoom'),
      };
      const platformStates = {
        douyu: document.getElementById('douyuState'),
        huya: document.getElementById('huyaState'),
        bilibili: document.getElementById('bilibiliState'),
      };
      const maxComments = 40;

      roomForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveRoomConfig();
      });

      async function loadRoomConfig() {
        try {
          const status = await fetchJson('/api/status');
          for (const platform of Object.keys(roomInputs)) {
            roomInputs[platform].value = status.platforms?.[platform]?.roomId || '';
          }
          renderPlatformStates(status.platforms || {});
          updateRoomMessage('当前房间信息已加载', 'success');
        } catch (error) {
          updateRoomMessage('加载房间信息失败：' + chineseError(error.message), 'error');
        }
      }

      async function saveRoomConfig() {
        saveRooms.disabled = true;
        updateRoomMessage('正在更新房间信息...', '');
        for (const platform of Object.keys(platformStates)) {
          platformStates[platform].textContent = '更新中';
          platformStates[platform].className = 'platform-state';
        }

        try {
          for (const platform of Object.keys(roomInputs)) {
            await fetchJson('/api/platforms/' + platform + '/room', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ roomId: roomInputs[platform].value.trim() }),
            });
          }

          const status = await fetchJson('/api/status');
          renderPlatformStates(status.platforms || {});
          const summary = Object.keys(roomInputs)
            .map((platform) => platformLabel(platform) + ': ' + platformStatusText(status.platforms?.[platform]))
            .join(' / ');
          updateRoomMessage('更新完成。' + summary, 'success');
        } catch (error) {
          updateRoomMessage('更新失败：' + chineseError(error.message), 'error');
        } finally {
          saveRooms.disabled = false;
        }
      }

      async function fetchJson(url, options) {
        const response = await fetch(url, options);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || response.statusText);
        }
        return payload;
      }

      function updateRoomMessage(text, type) {
        roomMessage.textContent = text;
        roomMessage.className = 'message ' + type;
      }

      function platformStatusText(status) {
        if (!status) return '未知';
        if (status.lastError) return statusLabel(status.status) + ' (' + chineseError(status.lastError) + ')';
        if (!status.roomId) return '已停用';
        return statusLabel(status.status);
      }

      function renderPlatformStates(platforms) {
        for (const platform of Object.keys(platformStates)) {
          const status = platforms[platform];
          const stateEl = platformStates[platform];
          const text = platformStatusText(status);
          stateEl.textContent = text;
          stateEl.title = text;
          stateEl.className = 'platform-state ' + platformStateClass(status);
        }
      }

      function platformStateClass(status) {
        if (!status || !status.roomId || status.status === 'disabled' || status.status === 'idle') return '';
        if (status.status === 'connected') return 'success';
        if (status.status === 'error' || status.lastError) return 'error';
        return '';
      }

      function statusLabel(status) {
        if (status === 'connected') return '已连接';
        if (status === 'connecting') return '连接中';
        if (status === 'disconnected') return '已断开';
        if (status === 'disabled') return '已停用';
        if (status === 'error') return '错误';
        if (status === 'idle') return '未启动';
        return '未知';
      }

      function chineseError(message) {
        const text = String(message || '');
        if (!text) return '未知错误';
        if (text.includes('room id is not configured')) return '房间号未配置';
        if (text.includes('does not exist or is unavailable')) return '房间不存在或暂不可用';
        if (text.includes('must be a positive number')) return '房间号必须是正整数';
        if (text.includes('hidden or locked')) return '房间已隐藏或锁定';
        if (text.includes('failed to resolve')) return '房间信息解析失败';
        if (text.includes('failed to parse')) return '房间信息解析失败';
        if (text.includes('Not Found')) return '接口不存在';
        if (text.includes('Internal Server Error')) return '服务内部错误';
        if (text.includes('Failed to fetch')) return '请求失败，请检查服务是否正常';
        return text;
      }

      function connect() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(protocol + '//' + location.host + '/ws/comments');

        ws.addEventListener('open', () => {
          statusEl.classList.add('connected');
          statusText.textContent = '页面已连接';
        });

        ws.addEventListener('close', () => {
          statusEl.classList.remove('connected');
          statusText.textContent = '页面重连中';
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

      loadRoomConfig();
      connect();
    </script>
  </body>
</html>`;
