# Game Live Comment

Forward live comments from Chinese streaming platforms to a PS5 Twitch chat overlay and a local web overlay.

First version:

- Douyu single-room adapter
- Huya single-room adapter
- Twitch IRC/TMI emulator on port `6667`
- Web overlay at `/overlay`
- Status API at `/api/status`
- Test comment API at `/api/test-comment`

## Development

```bash
npm install
npm run dev
```

Open:

- `http://127.0.0.1:3010/overlay`
- `http://127.0.0.1:3010/api/status`

Send a local test comment:

```bash
curl -X POST http://127.0.0.1:3010/api/test-comment \
  -H 'content-type: application/json' \
  -d '{"username":"本地测试","content":"hello ps5"}'
```

Switch Douyu room:

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/douyu/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"10942092"}'
```

Switch Huya room:

```bash
curl -X POST http://127.0.0.1:3010/api/platforms/huya/room \
  -H 'content-type: application/json' \
  -d '{"roomId":"kaerlol"}'
```

## Docker

```bash
docker compose up -d --build
```

Ports:

- `3010/tcp`: HTTP API and web overlay
- `6667/tcp`: Twitch IRC/TMI emulator for PS5

Edit `config.json` before starting the container.

## API

- `GET /overlay`: web overlay for debugging or OBS browser source
- `GET /api/status`: service, platform, queue, and recent comment status
- `POST /api/test-comment`: publish a local test comment
- `POST /api/platforms/douyu/room`: switch Douyu room and reconnect
- `POST /api/platforms/huya/room`: switch Huya room and reconnect

## PS5 Interaction Self Check

Automated checks cover the local Twitch IRC/TMI behavior that PS5 depends on:

- `CAP REQ` returns Twitch capability ACK
- `NICK` returns IRC welcome handshake
- `JOIN` returns join and names responses
- `PING` returns `PONG`
- comments are formatted as Twitch `PRIVMSG`
- `CommentBus` queues comments before broadcasting to IRC clients

Run:

```bash
npm run test
```

This cannot prove DNS redirection or the real PS5 screen overlay. Those still require a PS5 smoke test:

1. Redirect `irc.twitch.tv` and `tmi.twitch.tv` to this service.
2. Start the app.
3. Open PS5 Twitch broadcast UI.
4. Call `POST /api/test-comment`.
5. Confirm the comment appears on the PS5 overlay.

## PS5 DNS Redirect

Redirect these Twitch IRC domains to the machine running this service:

- `irc.twitch.tv:6667`
- `tmi.twitch.tv:6667`

DNS is intentionally not bundled in this first version.
