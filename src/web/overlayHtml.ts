export const overlayHtml = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Game Live Comment</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --bg: rgba(2, 6, 23, 0.82);
        --panel: rgba(15, 23, 42, 0.78);
        --panel-strong: rgba(15, 23, 42, 0.92);
        --border: rgba(148, 163, 184, 0.22);
        --muted: #94a3b8;
        --text: #f8fafc;
        --soft: #cbd5e1;
        --blue: #3b82f6;
        --green: #86efac;
        --red: #fca5a5;
        --amber: #fbbf24;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: transparent;
        color: var(--text);
        overflow: hidden;
      }
      button,
      input,
      select {
        font: inherit;
      }
      .app {
        width: 100vw;
        min-height: 100vh;
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        grid-template-rows: 64px minmax(0, 1fr) 34px;
        background: var(--bg);
        backdrop-filter: blur(10px);
      }
      .header {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 18px;
        border-bottom: 1px solid var(--border);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .brand-text {
        min-width: 0;
      }
      .logo {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        background: #2563eb;
        color: #fff;
        font-weight: 800;
      }
      .brand-title {
        margin: 0;
        font-size: 17px;
        line-height: 1.1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .brand-subtitle {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .language {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        color: var(--soft);
        font-size: 13px;
      }
      select {
        height: 34px;
        min-width: 118px;
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--panel-strong);
        color: var(--text);
        padding: 0 8px;
        outline: none;
      }
      .sidebar {
        padding: 14px 10px;
        border-right: 1px solid var(--border);
      }
      .nav {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .nav-button {
        width: 100%;
        height: 38px;
        display: flex;
        align-items: center;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--soft);
        padding: 0 12px;
        text-align: left;
        cursor: pointer;
      }
      .nav-button:hover,
      .nav-button.active {
        background: rgba(59, 130, 246, 0.16);
        color: #fff;
      }
      .nav-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .main {
        min-width: 0;
        overflow: hidden;
        padding: 16px;
      }
      .view {
        display: none;
        height: 100%;
        min-height: 0;
      }
      .view.active {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .view-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .view-title {
        margin: 0;
        font-size: 18px;
      }
      .view-description {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 13px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 30px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.28);
        color: var(--soft);
        font-size: 13px;
        white-space: nowrap;
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
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .comment {
        max-width: 100%;
        padding: 10px 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.48);
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
        color: var(--amber);
      }
      .platform-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .platform-card,
      .info-card {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
        padding: 12px;
      }
      .label-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }
      label {
        color: var(--soft);
        font-size: 13px;
        font-weight: 700;
      }
      .platform-state {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
        text-align: right;
      }
      .platform-state.success {
        color: var(--green);
      }
      .platform-state.error {
        color: var(--red);
      }
      input {
        width: 100%;
        height: 36px;
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
      .actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .primary-button {
        height: 36px;
        border: 0;
        border-radius: 6px;
        background: #2563eb;
        color: #fff;
        padding: 0 14px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .primary-button:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }
      .message {
        min-height: 20px;
        color: var(--soft);
        font-size: 13px;
      }
      .message.error {
        color: var(--red);
      }
      .message.success {
        color: var(--green);
      }
      .status-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .info-card h3 {
        margin: 0 0 8px;
        font-size: 14px;
      }
      .info-list {
        display: grid;
        gap: 8px;
        margin: 0;
      }
      .info-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--soft);
        font-size: 13px;
      }
      .info-row span:first-child {
        color: var(--muted);
      }
      .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }
      .setting-row:last-child {
        border-bottom: 0;
      }
      .setting-row p {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 12px;
      }
      .footer {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 18px;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 12px;
      }
      .footer a {
        color: #93c5fd;
        text-decoration: none;
      }
      .footer-links {
        display: flex;
        gap: 12px;
      }
      @media (max-width: 1040px) {
        .app {
          grid-template-columns: 150px minmax(0, 1fr);
        }
        .sidebar {
          padding: 14px 8px;
        }
        .nav-button {
          justify-content: flex-start;
          padding: 0 8px;
        }
      }
      @media (max-width: 820px) {
        body {
          overflow: auto;
        }
        .app {
          min-height: 100vh;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
        }
        .header {
          min-height: 58px;
          padding: 0 12px;
        }
        .brand {
          flex: 1 1 auto;
        }
        .brand-title {
          font-size: 15px;
        }
        .brand-subtitle {
          display: none;
        }
        .language span {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }
        select {
          min-width: 104px;
        }
        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--border);
          padding: 8px;
        }
        .nav {
          flex-direction: row;
          overflow-x: auto;
        }
        .nav-button {
          width: auto;
          min-width: max-content;
          justify-content: flex-start;
          padding: 0 12px;
        }
        .nav-label {
          position: static;
          width: auto;
          height: auto;
          overflow: visible;
          clip: auto;
          white-space: nowrap;
        }
        .main {
          overflow: visible;
        }
        .platform-grid,
        .status-grid {
          grid-template-columns: 1fr;
        }
        .footer {
          min-height: 34px;
          flex-wrap: wrap;
          padding: 8px 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header class="header">
        <div class="brand">
          <div class="logo">GL</div>
          <div class="brand-text">
            <h1 class="brand-title" data-i18n="appName">Game Live Comment</h1>
            <p class="brand-subtitle" data-i18n="appSubtitle">PS5 弹幕桥接</p>
          </div>
        </div>
        <label class="language">
          <span data-i18n="language">语言</span>
          <select id="languageSelect" aria-label="Language">
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </label>
      </header>

      <aside class="sidebar">
        <nav class="nav" aria-label="Main navigation">
          <button class="nav-button active" type="button" data-view-target="monitor" data-i18n-title="navMonitor" title="弹幕监控"><span class="nav-label" data-i18n="navMonitor">弹幕监控</span></button>
          <button class="nav-button" type="button" data-view-target="platforms" data-i18n-title="navPlatforms" title="平台配置"><span class="nav-label" data-i18n="navPlatforms">平台配置</span></button>
          <button class="nav-button" type="button" data-view-target="settings" data-i18n-title="navSettings" title="设置"><span class="nav-label" data-i18n="navSettings">设置</span></button>
          <button class="nav-button" type="button" data-view-target="system" data-i18n-title="navSystem" title="系统状态"><span class="nav-label" data-i18n="navSystem">系统状态</span></button>
          <button class="nav-button" type="button" data-view-target="about" data-i18n-title="navAbout" title="关于"><span class="nav-label" data-i18n="navAbout">关于</span></button>
        </nav>
      </aside>

      <main class="main">
        <section id="view-monitor" class="view active">
          <div class="view-header">
            <div>
              <h2 class="view-title" data-i18n="monitorTitle">弹幕监控</h2>
              <p class="view-description" data-i18n="monitorDescription">实时查看转发到页面和 PS5 的弹幕，最新消息显示在上方。</p>
            </div>
            <div id="status" class="status-pill">
              <span class="dot"></span>
              <span id="statusText" data-i18n="pageConnecting">页面连接中</span>
            </div>
          </div>
          <section id="comments" class="comments"></section>
        </section>

        <section id="view-platforms" class="view">
          <div class="view-header">
            <div>
              <h2 class="view-title" data-i18n="platformTitle">平台配置</h2>
              <p class="view-description" data-i18n="platformDescription">填写房间号后保存，留空表示停用对应平台。</p>
            </div>
          </div>
          <form id="roomForm">
            <div class="platform-grid">
              <div class="platform-card">
                <div class="label-row">
                  <label for="douyuRoom" data-i18n="douyuRoom">斗鱼房间号</label>
                  <span id="douyuState" class="platform-state"></span>
                </div>
                <input id="douyuRoom" name="douyu" autocomplete="off" data-i18n-placeholder="emptyToDisable" placeholder="留空则停用" />
              </div>
              <div class="platform-card">
                <div class="label-row">
                  <label for="huyaRoom" data-i18n="huyaRoom">虎牙房间号</label>
                  <span id="huyaState" class="platform-state"></span>
                </div>
                <input id="huyaRoom" name="huya" autocomplete="off" data-i18n-placeholder="emptyToDisable" placeholder="留空则停用" />
              </div>
              <div class="platform-card">
                <div class="label-row">
                  <label for="bilibiliRoom" data-i18n="bilibiliRoom">B站房间号</label>
                  <span id="bilibiliState" class="platform-state"></span>
                </div>
                <input id="bilibiliRoom" name="bilibili" autocomplete="off" data-i18n-placeholder="emptyToDisable" placeholder="留空则停用" />
              </div>
            </div>
            <div class="actions" style="margin-top: 12px;">
              <button id="saveRooms" class="primary-button" type="submit" data-i18n="saveRooms">更新/保存</button>
              <div id="roomMessage" class="message"></div>
            </div>
          </form>
        </section>

        <section id="view-settings" class="view">
          <div>
            <h2 class="view-title" data-i18n="settingsTitle">设置</h2>
            <p class="view-description" data-i18n="settingsDescription">这里先保留全局设置入口，后续可放弹幕格式、礼物开关和日志级别。</p>
          </div>
          <div class="info-card">
            <div class="setting-row">
              <div>
                <strong data-i18n="settingCommentFormat">弹幕格式</strong>
                <p data-i18n="settingCommentFormatDesc">当前由配置文件控制，后续可改为页面编辑。</p>
              </div>
              <span class="platform-state">[{platform}] {username}: {content}</span>
            </div>
            <div class="setting-row">
              <div>
                <strong data-i18n="settingGifts">礼物消息</strong>
                <p data-i18n="settingGiftsDesc">当前由各平台配置控制。</p>
              </div>
              <span class="platform-state" data-i18n="notEditableYet">暂不可在页面修改</span>
            </div>
          </div>
        </section>

        <section id="view-system" class="view">
          <div>
            <h2 class="view-title" data-i18n="systemTitle">系统状态</h2>
            <p class="view-description" data-i18n="systemDescription">查看 Web、PS5/Twitch 模拟服务和平台连接状态。</p>
          </div>
          <div class="status-grid">
            <div class="info-card">
              <h3 data-i18n="platformStatus">平台状态</h3>
              <div id="platformStatusList" class="info-list"></div>
            </div>
            <div class="info-card">
              <h3 data-i18n="runtimeStatus">运行状态</h3>
              <div class="info-list">
                <div class="info-row"><span data-i18n="webClients">Web 客户端</span><strong id="webClients">0</strong></div>
                <div class="info-row"><span data-i18n="commentsCount">已接收弹幕</span><strong id="commentsCount">0</strong></div>
                <div class="info-row"><span data-i18n="ps5Clients">PS5 客户端</span><strong id="ps5Clients">0</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section id="view-about" class="view">
          <div>
            <h2 class="view-title" data-i18n="aboutTitle">关于</h2>
            <p class="view-description" data-i18n="aboutDescription">Game Live Comment 用于将指定直播平台弹幕桥接到 PS5 Twitch 聊天和 Web 页面。</p>
          </div>
          <div class="info-card">
            <div class="info-list">
              <div class="info-row"><span>GitHub</span><a href="https://github.com/raykimurayyz/game-live-comment" target="_blank" rel="noreferrer">raykimurayyz/game-live-comment</a></div>
              <div class="info-row"><span>Docker Hub</span><a href="https://hub.docker.com/r/raykimurayyz/gamelivecomment" target="_blank" rel="noreferrer">raykimurayyz/gamelivecomment</a></div>
              <div class="info-row"><span data-i18n="license">许可</span><strong>MIT</strong></div>
            </div>
          </div>
        </section>
      </main>

      <footer class="footer">
        <span data-i18n="footerText">Created by @raykimurayyz</span>
        <span class="footer-links">
          <a href="https://github.com/raykimurayyz/game-live-comment" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://hub.docker.com/r/raykimurayyz/gamelivecomment" target="_blank" rel="noreferrer">Docker Hub</a>
          <span>MIT</span>
        </span>
      </footer>
    </div>

    <script>
      const i18n = {
        'zh-CN': {
          appName: 'Game Live Comment',
          appSubtitle: 'PS5 弹幕桥接',
          language: '语言',
          navMonitor: '弹幕监控',
          navPlatforms: '平台配置',
          navSettings: '设置',
          navSystem: '系统状态',
          navAbout: '关于',
          monitorTitle: '弹幕监控',
          monitorDescription: '实时查看转发到页面和 PS5 的弹幕，最新消息显示在上方。',
          platformTitle: '平台配置',
          platformDescription: '填写房间号后保存，留空表示停用对应平台。',
          settingsTitle: '设置',
          settingsDescription: '这里先保留全局设置入口，后续可放弹幕格式、礼物开关和日志级别。',
          systemTitle: '系统状态',
          systemDescription: '查看 Web、PS5/Twitch 模拟服务和平台连接状态。',
          aboutTitle: '关于',
          aboutDescription: 'Game Live Comment 用于将指定直播平台弹幕桥接到 PS5 Twitch 聊天和 Web 页面。',
          douyuRoom: '斗鱼房间号',
          huyaRoom: '虎牙房间号',
          bilibiliRoom: 'B站房间号',
          emptyToDisable: '留空则停用',
          saveRooms: '更新/保存',
          pageConnecting: '页面连接中',
          pageConnected: '页面已连接',
          pageReconnecting: '页面重连中',
          roomsLoaded: '当前房间信息已加载',
          roomsLoadFailed: '加载房间信息失败：',
          roomsUpdating: '正在更新房间信息...',
          updating: '更新中',
          roomsUpdated: '更新完成。',
          roomsUpdateFailed: '更新失败：',
          unknown: '未知',
          disabled: '已停用',
          connected: '已连接',
          connecting: '连接中',
          disconnected: '已断开',
          error: '错误',
          idle: '未启动',
          platformStatus: '平台状态',
          runtimeStatus: '运行状态',
          webClients: 'Web 客户端',
          commentsCount: '已接收弹幕',
          ps5Clients: 'PS5 客户端',
          settingCommentFormat: '弹幕格式',
          settingCommentFormatDesc: '当前由配置文件控制，后续可改为页面编辑。',
          settingGifts: '礼物消息',
          settingGiftsDesc: '当前由各平台配置控制。',
          notEditableYet: '暂不可在页面修改',
          license: '许可',
          footerText: 'Created by @raykimurayyz',
          mock: '测试',
          unknownError: '未知错误',
          roomIdNotConfigured: '房间号未配置',
          roomUnavailable: '房间不存在或暂不可用',
          positiveNumber: '房间号必须是正整数',
          hiddenOrLocked: '房间已隐藏或锁定',
          resolveFailed: '房间信息解析失败',
          notFound: '接口不存在',
          serverError: '服务内部错误',
          fetchFailed: '请求失败，请检查服务是否正常',
        },
        'en-US': {
          appName: 'Game Live Comment',
          appSubtitle: 'PS5 comment bridge',
          language: 'Language',
          navMonitor: 'Comments',
          navPlatforms: 'Platforms',
          navSettings: 'Settings',
          navSystem: 'System',
          navAbout: 'About',
          monitorTitle: 'Comments',
          monitorDescription: 'Watch comments forwarded to the web page and PS5. Newest comments appear at the top.',
          platformTitle: 'Platform Configuration',
          platformDescription: 'Enter room IDs and save. Leave a field empty to disable that platform.',
          settingsTitle: 'Settings',
          settingsDescription: 'Global settings live here. Comment format, gift messages, and log level can be added later.',
          systemTitle: 'System Status',
          systemDescription: 'Check the web, PS5/Twitch emulation, and platform connection state.',
          aboutTitle: 'About',
          aboutDescription: 'Game Live Comment bridges comments from specified streaming platforms to PS5 Twitch chat and a web page.',
          douyuRoom: 'Douyu room ID',
          huyaRoom: 'Huya room ID',
          bilibiliRoom: 'Bilibili room ID',
          emptyToDisable: 'Leave empty to disable',
          saveRooms: 'Update / Save',
          pageConnecting: 'Page connecting',
          pageConnected: 'Page connected',
          pageReconnecting: 'Page reconnecting',
          roomsLoaded: 'Room information loaded',
          roomsLoadFailed: 'Failed to load room information: ',
          roomsUpdating: 'Updating room information...',
          updating: 'Updating',
          roomsUpdated: 'Updated. ',
          roomsUpdateFailed: 'Update failed: ',
          unknown: 'Unknown',
          disabled: 'Disabled',
          connected: 'Connected',
          connecting: 'Connecting',
          disconnected: 'Disconnected',
          error: 'Error',
          idle: 'Idle',
          platformStatus: 'Platform Status',
          runtimeStatus: 'Runtime Status',
          webClients: 'Web clients',
          commentsCount: 'Received comments',
          ps5Clients: 'PS5 clients',
          settingCommentFormat: 'Comment format',
          settingCommentFormatDesc: 'Currently controlled by the config file. Page editing can be added later.',
          settingGifts: 'Gift messages',
          settingGiftsDesc: 'Currently controlled by each platform config.',
          notEditableYet: 'Not editable on this page yet',
          license: 'License',
          footerText: 'Created by @raykimurayyz',
          mock: 'Test',
          unknownError: 'Unknown error',
          roomIdNotConfigured: 'Room ID is not configured',
          roomUnavailable: 'Room does not exist or is unavailable',
          positiveNumber: 'Room ID must be a positive number',
          hiddenOrLocked: 'Room is hidden or locked',
          resolveFailed: 'Failed to resolve room information',
          notFound: 'API route not found',
          serverError: 'Internal server error',
          fetchFailed: 'Request failed. Check whether the service is running',
        },
        'ja-JP': {
          appName: 'Game Live Comment',
          appSubtitle: 'PS5 コメントブリッジ',
          language: '言語',
          navMonitor: 'コメント監視',
          navPlatforms: 'プラットフォーム',
          navSettings: '設定',
          navSystem: 'システム',
          navAbout: '概要',
          monitorTitle: 'コメント監視',
          monitorDescription: 'Web ページと PS5 に転送されるコメントをリアルタイムで確認します。最新のコメントは上に表示されます。',
          platformTitle: 'プラットフォーム設定',
          platformDescription: 'ルーム ID を入力して保存します。空欄にするとそのプラットフォームを無効化します。',
          settingsTitle: '設定',
          settingsDescription: 'ここはグローバル設定用です。コメント形式、ギフト表示、ログレベルは後で追加できます。',
          systemTitle: 'システム状態',
          systemDescription: 'Web、PS5/Twitch エミュレーション、各プラットフォームの接続状態を確認します。',
          aboutTitle: '概要',
          aboutDescription: 'Game Live Comment は指定した配信プラットフォームのコメントを PS5 Twitch チャットと Web ページへ転送します。',
          douyuRoom: 'Douyu ルーム ID',
          huyaRoom: 'Huya ルーム ID',
          bilibiliRoom: 'Bilibili ルーム ID',
          emptyToDisable: '空欄で無効化',
          saveRooms: '更新 / 保存',
          pageConnecting: 'ページ接続中',
          pageConnected: 'ページ接続済み',
          pageReconnecting: 'ページ再接続中',
          roomsLoaded: 'ルーム情報を読み込みました',
          roomsLoadFailed: 'ルーム情報の読み込みに失敗しました: ',
          roomsUpdating: 'ルーム情報を更新しています...',
          updating: '更新中',
          roomsUpdated: '更新しました。 ',
          roomsUpdateFailed: '更新に失敗しました: ',
          unknown: '不明',
          disabled: '無効',
          connected: '接続済み',
          connecting: '接続中',
          disconnected: '切断',
          error: 'エラー',
          idle: '未起動',
          platformStatus: 'プラットフォーム状態',
          runtimeStatus: '実行状態',
          webClients: 'Web クライアント',
          commentsCount: '受信コメント',
          ps5Clients: 'PS5 クライアント',
          settingCommentFormat: 'コメント形式',
          settingCommentFormatDesc: '現在は設定ファイルで管理しています。ページ編集は後で追加できます。',
          settingGifts: 'ギフトメッセージ',
          settingGiftsDesc: '現在は各プラットフォーム設定で管理しています。',
          notEditableYet: 'このページではまだ編集できません',
          license: 'ライセンス',
          footerText: 'Created by @raykimurayyz',
          mock: 'テスト',
          unknownError: '不明なエラー',
          roomIdNotConfigured: 'ルーム ID が未設定です',
          roomUnavailable: 'ルームが存在しないか利用できません',
          positiveNumber: 'ルーム ID は正の数である必要があります',
          hiddenOrLocked: 'ルームは非公開またはロックされています',
          resolveFailed: 'ルーム情報の解析に失敗しました',
          notFound: 'API が見つかりません',
          serverError: 'サーバー内部エラー',
          fetchFailed: 'リクエストに失敗しました。サービスの状態を確認してください',
        },
      };

      const statusEl = document.getElementById('status');
      const statusText = document.getElementById('statusText');
      const commentsEl = document.getElementById('comments');
      const roomForm = document.getElementById('roomForm');
      const roomMessage = document.getElementById('roomMessage');
      const saveRooms = document.getElementById('saveRooms');
      const languageSelect = document.getElementById('languageSelect');
      const platformStatusList = document.getElementById('platformStatusList');
      const webClients = document.getElementById('webClients');
      const commentsCount = document.getElementById('commentsCount');
      const ps5Clients = document.getElementById('ps5Clients');
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
      let currentLanguage = localStorage.getItem('glc-language') || 'zh-CN';
      let lastStatus;
      let pageConnected = false;

      document.querySelectorAll('[data-view-target]').forEach((button) => {
        button.addEventListener('click', () => switchView(button.dataset.viewTarget));
      });

      languageSelect.value = i18n[currentLanguage] ? currentLanguage : 'zh-CN';
      currentLanguage = languageSelect.value;
      languageSelect.addEventListener('change', () => {
        currentLanguage = languageSelect.value;
        localStorage.setItem('glc-language', currentLanguage);
        applyI18n();
        renderPlatformStates(lastStatus?.platforms || {});
        renderSystemStatus(lastStatus);
        statusText.textContent = t(pageConnected ? 'pageConnected' : 'pageReconnecting');
      });

      roomForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveRoomConfig();
      });

      function switchView(viewName) {
        document.querySelectorAll('[data-view-target]').forEach((button) => {
          button.classList.toggle('active', button.dataset.viewTarget === viewName);
        });
        document.querySelectorAll('.view').forEach((view) => {
          view.classList.toggle('active', view.id === 'view-' + viewName);
        });
      }

      async function loadRoomConfig() {
        try {
          const status = await fetchJson('/api/status');
          lastStatus = status;
          for (const platform of Object.keys(roomInputs)) {
            roomInputs[platform].value = status.platforms?.[platform]?.roomId || '';
          }
          renderPlatformStates(status.platforms || {});
          renderSystemStatus(status);
          updateRoomMessage(t('roomsLoaded'), 'success');
        } catch (error) {
          updateRoomMessage(t('roomsLoadFailed') + localizeError(error.message), 'error');
        }
      }

      async function saveRoomConfig() {
        saveRooms.disabled = true;
        updateRoomMessage(t('roomsUpdating'), '');
        for (const platform of Object.keys(platformStates)) {
          platformStates[platform].textContent = t('updating');
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
          lastStatus = status;
          renderPlatformStates(status.platforms || {});
          renderSystemStatus(status);
          const summary = Object.keys(roomInputs)
            .map((platform) => platformLabel(platform) + ': ' + platformStatusText(status.platforms?.[platform]))
            .join(' / ');
          updateRoomMessage(t('roomsUpdated') + summary, 'success');
        } catch (error) {
          updateRoomMessage(t('roomsUpdateFailed') + localizeError(error.message), 'error');
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
        if (!status) return t('unknown');
        if (status.lastError) return statusLabel(status.status) + ' (' + localizeError(status.lastError) + ')';
        if (!status.roomId) return t('disabled');
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

      function renderSystemStatus(status) {
        if (!status) {
          return;
        }
        webClients.textContent = String(status.web?.webClients ?? 0);
        commentsCount.textContent = String(status.comments?.totalComments ?? 0);
        ps5Clients.textContent = String(status.twitch?.connectedClients ?? 0);
        platformStatusList.innerHTML = '';
        for (const platform of Object.keys(roomInputs)) {
          const row = document.createElement('div');
          row.className = 'info-row';
          row.innerHTML =
            '<span>' +
            escapeHtml(platformLabel(platform)) +
            '</span><strong class="' +
            escapeHtml(platformStateClass(status.platforms?.[platform])) +
            '">' +
            escapeHtml(platformStatusText(status.platforms?.[platform])) +
            '</strong>';
          platformStatusList.appendChild(row);
        }
      }

      function platformStateClass(status) {
        if (!status || !status.roomId || status.status === 'disabled' || status.status === 'idle') return '';
        if (status.status === 'connected') return 'success';
        if (status.status === 'error' || status.lastError) return 'error';
        return '';
      }

      function statusLabel(status) {
        if (status === 'connected') return t('connected');
        if (status === 'connecting') return t('connecting');
        if (status === 'disconnected') return t('disconnected');
        if (status === 'disabled') return t('disabled');
        if (status === 'error') return t('error');
        if (status === 'idle') return t('idle');
        return t('unknown');
      }

      function localizeError(message) {
        const text = String(message || '');
        if (!text) return t('unknownError');
        if (text.includes('room id is not configured')) return t('roomIdNotConfigured');
        if (text.includes('does not exist or is unavailable')) return t('roomUnavailable');
        if (text.includes('must be a positive number')) return t('positiveNumber');
        if (text.includes('hidden or locked')) return t('hiddenOrLocked');
        if (text.includes('failed to resolve')) return t('resolveFailed');
        if (text.includes('failed to parse')) return t('resolveFailed');
        if (text.includes('Not Found')) return t('notFound');
        if (text.includes('Internal Server Error')) return t('serverError');
        if (text.includes('Failed to fetch')) return t('fetchFailed');
        return text;
      }

      function connect() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(protocol + '//' + location.host + '/ws/comments');

        ws.addEventListener('open', () => {
          pageConnected = true;
          statusEl.classList.add('connected');
          statusText.textContent = t('pageConnected');
        });

        ws.addEventListener('close', () => {
          pageConnected = false;
          statusEl.classList.remove('connected');
          statusText.textContent = t('pageReconnecting');
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
        return t('mock');
      }

      function applyI18n() {
        document.documentElement.lang = currentLanguage;
        document.querySelectorAll('[data-i18n]').forEach((node) => {
          node.textContent = t(node.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
          node.placeholder = t(node.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-title]').forEach((node) => {
          node.title = t(node.dataset.i18nTitle);
        });
      }

      function t(key) {
        return i18n[currentLanguage]?.[key] || i18n['zh-CN'][key] || key;
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }

      applyI18n();
      loadRoomConfig();
      connect();
    </script>
  </body>
</html>`;
