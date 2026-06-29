# Game Live Comment

Forward live comments from Chinese streaming platforms to a PS5 Twitch chat overlay and a local web overlay.

First version:

- Douyu single-room adapter
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

## PS5 DNS Redirect

Redirect these Twitch IRC domains to the machine running this service:

- `irc.twitch.tv:6667`
- `tmi.twitch.tv:6667`

DNS is intentionally not bundled in this first version.
